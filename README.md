# IP-API

> 本项目修改自 [ccbikai/ip-api](https://github.com/ccbikai/ip-api)，添加了新的特性和界面优化。

一个基于 Cloudflare Workers 的 IP 地址查询工具，支持 IPv4/IPv6 地址检测和地理位置信息查询，采用 PornHub 风格设计。

## 功能特点

- 同时支持 IPv4 和 IPv6 地址检测
- 多数据源支持（IP-API、IPInfo、Cloudflare）
- 实时地理位置信息
- PornHub 风格的界面设计
- 响应式布局，支持移动端

## 部署方式

### Cloudflare Workers 部署
1. 访问 [Cloudflare Workers](https://workers.cloudflare.com/)
2. 点击 "Create a Service"
3. 在 Quick Edit 编辑器中粘贴 `src/index.js` 中的代码
4. 点击 "Save and Deploy"

完整的 Worker 代码请查看：[src/index.js](src/index.js)

### 自定义域名（可选）

1. 在 Workers 页面找到您的 Worker
2. 点击 "Add Custom Domain"
3. 输入您的域名并保存
4. 按照提示配置 DNS 记录

### IPv4/IPv6 设置

Cloudflare 支持 IPv4 和 IPv6 访问，如果需要只支持单栈：
- 仅 IPv4：只添加 A 记录
- 仅 IPv6：只添加 AAAA 记录

## 注意事项

- 免费版 Workers 每天有 100,000 请求限制
- 建议使用自定义域名以获得更好的访问体验
- 如需更新代码，直接在 Workers 编辑器中修改并重新部署即可

## 问题反馈

如有问题，欢迎提交 Issue 或 Pull Request
