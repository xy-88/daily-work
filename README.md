# 账簿 · Ledger

自动识别微信 / 支付宝账单的记账软件，支持统计分类与多端同步。纯前端 PWA，可部署到 GitHub Pages，手机可安装到桌面离线使用。

## 本地开发

```bash
npm install
npm run dev      # 开发服务器
npm run build    # 生产构建到 dist/
npm run preview  # 预览生产构建
```

> 需要 Node 18+（推荐 22）。

## 部署到 GitHub Pages

已配置 [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)，推送到 `main` 分支即自动构建部署。

1. 在 GitHub 新建仓库（任意名字，例如 `gold-show`）。
2. 本地初始化并推送：
   ```bash
   git init
   git add .
   git commit -m "init: 账簿记账软件"
   git branch -M main
   git remote add origin https://github.com/<你的用户名>/<仓库名>.git
   git push -u origin main
   ```
3. 仓库 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**。
4. 等待 Actions 跑完，访问 `https://<你的用户名>.github.io/<仓库名>/`。

> 采用相对路径 (`base: './'`) + HashRouter，任意仓库名 / 子路径都能直接用，刷新不会 404。

## 在手机上使用

- 用手机浏览器打开上面的线上地址 → 浏览器菜单选「添加到主屏幕」即可像 App 一样安装（PWA），支持离线。
- **数据同步**：每台设备数据独立存于本地。在「设置 → 多端同步」生成同步串码，在另一台设备粘贴合并（按时间戳合并，后写覆盖）。
- 也可在「设置 → 数据备份」导出 JSON 全量备份 / 恢复。

## 技术栈

React 18 + TypeScript + Vite 5 + Tailwind 3 + Zustand + React Router 6（HashRouter）。数据持久化于 IndexedDB。
