export default {
  async fetch(request) {
    const url = new URL(request.url)
    if (url.protocol === 'http:') {
      return Response.redirect(`https://${url.host}${url.pathname}${url.search}`, 301)
    }

    try {
      // 获取所有可能的 IP 头部
      const headers = {
        'cf-connecting-ip': request.headers.get('cf-connecting-ip'),
        'cf-connecting-ipv6': request.headers.get('cf-connecting-ipv6'),
        'cf-pseudo-ipv4': request.headers.get('cf-pseudo-ipv4'),
        'true-client-ip': request.headers.get('true-client-ip'),
        'x-real-ip': request.headers.get('x-real-ip'),
        'x-forwarded-for': request.headers.get('x-forwarded-for'),
      }

      // 并行请求外部 API
      const [ipApiResponse, ipInfoResponse] = await Promise.all([
        fetch('http://ip-api.com/json/?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,query,proxy,hosting'),
        fetch('https://ipinfo.io/json')
      ])

      const ipApiData = await ipApiResponse.json()
      const ipInfoData = await ipInfoResponse.json()

      // 检查 IP 类型的函数
      const isIPv4 = (ip) => ip && /^(\d{1,3}\.){3}\d{1,3}$/.test(ip)
      const isIPv6 = (ip) => ip && ip.includes(':')

      // 获取 IPv4
      let ipv4 = null
      // 按优先级检查 IPv4
      if (headers['cf-pseudo-ipv4'] && isIPv4(headers['cf-pseudo-ipv4'])) {
        ipv4 = headers['cf-pseudo-ipv4']
      } else if (ipApiData.query && isIPv4(ipApiData.query)) {
        ipv4 = ipApiData.query
      } else if (ipInfoData.ip && isIPv4(ipInfoData.ip)) {
        ipv4 = ipInfoData.ip
      } else {
        // 检查其他头部
        for (const headerValue of Object.values(headers)) {
          if (headerValue && isIPv4(headerValue)) {
            ipv4 = headerValue
            break
          }
          // 处理可能包含多个 IP 的情况
          if (headerValue && headerValue.includes(',')) {
            const ips = headerValue.split(',').map(ip => ip.trim())
            const firstIpv4 = ips.find(ip => isIPv4(ip))
            if (firstIpv4) {
              ipv4 = firstIpv4
              break
            }
          }
        }
      }

      // 获取 IPv6
      let ipv6 = null
      // 按优先级检查 IPv6
      if (headers['cf-connecting-ipv6'] && isIPv6(headers['cf-connecting-ipv6'])) {
        ipv6 = headers['cf-connecting-ipv6']
      } else {
        // 检查其他头部
        for (const headerValue of Object.values(headers)) {
          if (headerValue && isIPv6(headerValue)) {
            ipv6 = headerValue
            break
          }
          // 处理可能包含多个 IP 的情况
          if (headerValue && headerValue.includes(',')) {
            const ips = headerValue.split(',').map(ip => ip.trim())
            const firstIpv6 = ips.find(ip => isIPv6(ip))
            if (firstIpv6) {
              ipv6 = firstIpv6
              break
            }
          }
        }
      }

      // 获取 CF 信息
      const cf = request.cf || {}
      const country = cf.country || ipApiData.country || ipInfoData.country || '-'
      const region = cf.region || ipApiData.regionName || ipInfoData.region || '-'
      const city = cf.city || ipApiData.city || ipInfoData.city || '-'
      const asn = cf.asn || (ipApiData.as ? ipApiData.as.replace(/^AS/, '') : '') || ipInfoData.org || '-'
      const asOrganization = cf.asOrganization || ipApiData.isp || ipInfoData.org || '-'

      // 获取所有可能的 IP 信息来源
      const ipInfo = {
        'IP-API': {
          ip: ipv4 || '-',
          ipv6: ipv6 || '-',
          provider: ipApiData.isp || '-',
          location: `${ipApiData.country} ${ipApiData.regionName} ${ipApiData.city}`
        },
        'IPInfo': {
          ip: ipv4 || '-',
          ipv6: ipv6 || '-',
          provider: ipInfoData.org || '-',
          location: `${ipInfoData.country} ${ipInfoData.region} ${ipInfoData.city}`
        },
        'Cloudflare': {
          ip: ipv4 || '-',
          ipv6: ipv6 || '-',
          provider: asOrganization,
          location: `${country} ${region} ${city}`
        },
        'ASN信息': {
          ip: ipv4 || '-',
          ipv6: ipv6 || '-',
          provider: `AS${asn} ${asOrganization}`,
          location: `${country} ${city}`
        }
      }

      return new Response(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>IP 查询</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
              background: linear-gradient(135deg, #000000, #1a1a1a);
              color: #ffffff;
              padding: 20px;
              min-height: 100vh;
            }
            .container {
              max-width: 1200px;
              margin: 0 auto;
              animation: fadeIn 0.5s ease-out;
            }
            .header {
              text-align: center;
              margin: 40px 0;
              padding: 30px;
              background: rgba(27, 27, 27, 0.95);
              border-radius: 16px;
              box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
              backdrop-filter: blur(10px);
              border: 1px solid rgba(255, 144, 0, 0.1);
              transition: transform 0.3s ease;
            }
            .header:hover {
              transform: translateY(-5px);
            }
            .logo {
              font-size: 42px;
              font-weight: 800;
              color: #ffffff;
              margin-bottom: 30px;
              text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
            }
            .logo span {
              background: linear-gradient(45deg, #ff9000, #ff6b00);
              color: #000000;
              padding: 4px 12px;
              border-radius: 8px;
              display: inline-block;
              transform: skew(-10deg);
              transition: transform 0.3s ease;
            }
            .logo span:hover {
              transform: skew(-10deg) scale(1.05);
            }
            .ip {
              font-size: 36px;
              font-weight: 700;
              margin: 15px 0;
              color: #ffffff;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 10px;
            }
            .ip span {
              color: #ff9000;
              text-shadow: 0 0 20px rgba(255, 144, 0, 0.3);
              transition: color 0.3s ease;
            }
            .ip span:hover {
              color: #ff6b00;
            }
            .subtitle {
              color: #999999;
              margin: 15px 0;
              font-size: 16px;
              font-weight: 500;
            }
            .info-card {
              background: rgba(27, 27, 27, 0.95);
              border-radius: 16px;
              padding: 30px;
              margin: 20px 0;
              box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
              backdrop-filter: blur(10px);
              border: 1px solid rgba(255, 144, 0, 0.1);
              transition: transform 0.3s ease;
            }
            .info-card:hover {
              transform: translateY(-5px);
            }
            table {
              width: 100%;
              border-collapse: separate;
              border-spacing: 0;
            }
            th, td {
              padding: 20px;
              text-align: left;
              border-bottom: 1px solid rgba(255, 144, 0, 0.1);
              transition: background-color 0.3s ease;
            }
            tr:hover td {
              background-color: rgba(255, 144, 0, 0.05);
            }
            tr:last-child th,
            tr:last-child td {
              border-bottom: none;
            }
            th {
              color: #999999;
              font-weight: 600;
              width: 180px;
              font-size: 15px;
            }
            td {
              font-weight: 500;
              color: #ffffff;
            }
            .status {
              display: inline-block;
              width: 10px;
              height: 10px;
              border-radius: 50%;
              background: linear-gradient(45deg, #ff9000, #ff6b00);
              margin-right: 12px;
              box-shadow: 0 0 10px rgba(255, 144, 0, 0.5);
              animation: pulse 2s infinite;
            }
            .provider {
              color: #999999;
              font-size: 14px;
              margin-top: 6px;
              transition: color 0.3s ease;
            }
            .provider:hover {
              color: #ff9000;
            }
            .ip-value {
              color: #ff9000;
              font-weight: 600;
              font-size: 16px;
              display: flex;
              align-items: center;
              margin: 8px 0;
            }
            .button {
              display: inline-block;
              background: linear-gradient(45deg, #ff9000, #ff6b00);
              color: #000000;
              padding: 12px 30px;
              border-radius: 8px;
              text-decoration: none;
              font-weight: 600;
              margin-top: 25px;
              transition: all 0.3s ease;
              border: none;
              cursor: pointer;
              text-transform: uppercase;
              letter-spacing: 1px;
              font-size: 14px;
              box-shadow: 0 4px 15px rgba(255, 144, 0, 0.3);
            }
            .button:hover {
              transform: translateY(-2px);
              box-shadow: 0 6px 20px rgba(255, 144, 0, 0.4);
              background: linear-gradient(45deg, #ff6b00, #ff5100);
            }
            .button:active {
              transform: translateY(0);
            }
            @keyframes fadeIn {
              from {
                opacity: 0;
                transform: translateY(20px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
            @keyframes pulse {
              0% {
                box-shadow: 0 0 0 0 rgba(255, 144, 0, 0.4);
              }
              70% {
                box-shadow: 0 0 0 10px rgba(255, 144, 0, 0);
              }
              100% {
                box-shadow: 0 0 0 0 rgba(255, 144, 0, 0);
              }
            }
            @media (max-width: 768px) {
              body {
                padding: 15px;
              }
              .header {
                padding: 20px;
                margin: 20px 0;
              }
              .logo {
                font-size: 32px;
              }
              .ip {
                font-size: 24px;
              }
              th {
                width: 120px;
                font-size: 14px;
              }
              th, td {
                padding: 15px;
              }
              .info-card {
                padding: 20px;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">IP<span>HUB</span></div>
              <div class="ip">IPv4: <span>${ipv4 || '未检测到'}</span></div>
              <div class="ip">IPv6: <span>${ipv6 || '未检测到'}</span></div>
              <div class="subtitle">您的 IP 地址</div>
              <div class="subtitle">ISP: ${asOrganization}</div>
              <button onclick="location.reload()" class="button">刷新数据</button>
            </div>
            
            <div class="info-card">
              <table>
                ${Object.entries(ipInfo).map(([source, info]) => `
                  <tr>
                    <th>${source}</th>
                    <td>
                      <span class="status"></span>
                      <div class="ip-value">IPv4: ${info.ip}</div>
                      ${info.ipv6 !== '-' ? `<div class="ip-value">IPv6: ${info.ipv6}</div>` : ''}
                      ${info.location ? `<div class="provider">${info.location}</div>` : ''}
                      ${info.provider ? `<div class="provider">${info.provider}</div>` : ''}
                    </td>
                  </tr>
                `).join('')}
              </table>
            </div>
          </div>
        </body>
        </html>
      `, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'content-type': 'text/html;charset=UTF-8',
          'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
        }
      })
    } catch (error) {
      console.error('Error fetching IP data:', error)
      return new Response('Error fetching IP data', { status: 500 })
    }
  }
}
