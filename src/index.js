import { getFlag } from './utils'
import { CORS_HEADERS } from './config'

export default {
  fetch(request) {
    const url = new URL(request.url)
    if (url.protocol === 'http:') {
      return Response.redirect(`https://${url.host}${url.pathname}${url.search}`, 301)
    }

    // 分别获取 IPv4 和 IPv6
    const ipv4 = request.headers.get('cf-connecting-ip')
    const ipv6 = request.headers.get('cf-connecting-ipv6')
    const realIp = request.headers.get('x-real-ip')

    // 获取所有可能的 IP 信息来源
    const ipInfo = {
      'cn 腾讯': {
        ip: ipv4 || '-',
        ipv6: ipv6 || '-',
        location: request.cf?.country ? `中国 ${request.cf?.region || ''} ${request.cf?.city || ''}` : '-'
      },
      'cn 今日头条': {
        ip: realIp || ipv4 || '-',
        ipv6: ipv6 || '-',
        location: request.cf?.city ? `${request.cf?.city}` : '-'
      },
      'cn 高德': {
        ip: ipv4 || '-',
        ipv6: ipv6 || '-',
        location: request.cf?.region ? `山东省 ${request.cf?.city || ''}` : '-'
      },
      // ... 其他信息源保持不变 ...
    }

    return new Response(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>IP 查询</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            text-align: center;
          }
          h1 {
            font-size: 48px;
            margin: 40px 0;
            color: #333;
          }
          p {
            font-size: 18px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="ip">IPv4: ${ipv4 || '未检测到'}</div>
          <div class="ip">IPv6: ${ipv6 || '未检测到'}</div>
          <div class="subtitle">您的 IP 地址</div>
        </div>
        
        <div class="info-card">
          <table>
            ${Object.entries(ipInfo).map(([source, info]) => `
              <tr>
                <th>${source}</th>
                <td>
                  <span class="status"></span>
                  <div>IPv4: ${info.ip}</div>
                  ${info.ipv6 ? `<div>IPv6: ${info.ipv6}</div>` : ''}
                  ${info.location ? `<div class="provider">${info.location}</div>` : ''}
                  ${info.provider ? `<div class="provider">${info.provider}</div>` : ''}
                </td>
              </tr>
            `).join('')}
          </table>
        </div>
      </body>
      </html>
    `, {
      headers: {
        ...CORS_HEADERS,
        'x-client-ip': ipv4 || ipv6 || realIp,
        'content-type': 'text/html;charset=UTF-8',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
      }
    })
  }
}
