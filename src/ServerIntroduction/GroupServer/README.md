---
title: 群组服
shortTitle: 群组服
icon: /assets/cos/2025/03/21/67dd117c8bf60.jpg
author: NPUcraft
dir:
  collapsible: false
  link: true
  order: 10
---

群组服用 **Velocity** 把多个后端挂在同一入口：连 `mc.npucraft.com`（备用 `mc2.npucraft.com`）后进入 **登录大厅**，再切到生存或小游戏。客户端版本与跨版本说明见 [更新日志](/Overview/Changelog)。

各子服的背包、经济**不共用一套规则**。生存三服之间由 HuskSync 与西瓜币对齐；大厅、Bingo、船坞各自独立，不要指望把生存装备带进小游戏。

## 子服一览


| 页面 | 后端 ID | 怎么去 |
| --- | --- | --- |
| [登录大厅](./Lobby.md) | `Lobby` | 进服默认位置；其它服用 `/hub`、`/lobby` 回来 |
| [生存服](./Survival.md) | `Survival-Main` / `Survival-Industry` / `Survival-Resource` | `/zf`、`/gyf`、`/zyf` 或大厅传送门 |
| [小游戏服](./MiniGames/) | `Bingo`、`Shipyard`、`HideAndSeek`、`GameArcade` | 大厅对应传送门，或 `/server <后端ID>` |


切服短命令由 [ServerTeleport](/PluginIntroduction/ServerTeleport) 提供；大厅里的门由 [AdvancedPortals](/PluginIntroduction/AdvancedPortals) 触发。
