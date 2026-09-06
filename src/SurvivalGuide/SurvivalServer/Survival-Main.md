---
title: 主服
icon: fluent-emoji-flat:houses
prev: ./
next: ./Survival-Industry.md
tag:
  - Survival-Main
category:
  - GroupServer
---

主服（`Survival-Main`）是生存组的**社交与聚居中心**：轨道交通、玩家聚落、领地和商店都集中于此。后端为 **Leaves 1.21.8**，难度困难，视距 **24**、模拟距离 **12**（三服里最远），方便在主城和车站一带看清建筑。为控制卡顿与保护景观，主服对规划区、实体与流体、以及「工业级」设施有明确限制；需要大规模生电或破坏性开采时，请使用 [工业服](./Survival-Industry.md) 或 [资源服](./Survival-Resource.md)。

::: tip 如何进入主服

在代理端使用切服别名 `/zf`（等价于连接后端 `Survival-Main`），或在大厅走通往主服的传送门。大厅与其它生存子服之间的具体规则见 [ServerTeleport](/PluginIntroduction/ServerTeleport)。总览见 [生存服介绍](./README.md)。

:::

## **与其它世界的分工**

| 内容 | 说明 |
|------|------|
| 日常基地、装饰、社区聚居与轨道交通 | 以主服为主 |
| 圈地、出租、玩家商店与系统商店 | **只在主服**把整套经济玩法开齐 |
| 刷怪塔、全自动农场、大型生电产线 | 请使用 [工业服](./Survival-Industry.md) |
| 大范围地形破坏、探索向刷资源 | 请使用 [资源服](./Survival-Resource.md) |

## **规划区域限制**

- 主城周边空置域及末地主岛均为**规划区**，禁止擅自建造生存基地或大规模改动地形。
- 建议优先在**已有玩家聚集地**附近发展，便于协作与交通接驳，也有利于形成稳定的社区氛围。
- 卫星地图上的**保留区**边界具有参考价值；保留区外区域在版本迭代时可能被重置，请避免在「远期仍想保留」的工程上过度投入。

::: warning 不确定是否属于规划区时

开工前务必对照 [卫星地图](https://map.npucraft.com/dynmap/) 或与管理员确认，避免建筑日后被纳入调整范围。

:::

## **基地建造要求**

- **实体**：严格限制生物数量与密集圈养，减轻服务端 AI 与碰撞计算压力。若确需大量实体（如交易牛场、部分机器配套），须**提前向管理员报备**，并将设施布置在远离主城、车站等**高频加载区**的位置。
- **流动水 / 流体**：大面积流动水、复杂瀑布墙等会显著增加运算负担，请节制使用；生电向流体装置请放在工业服。
- **生电与开采**：凡属**工业级**设施（刷怪塔、全自动作物/矿物农场、大型熔炉组等）以及**破坏性**资源开采，均应转移至 [工业服](./Survival-Industry.md) 或 [资源服](./Survival-Resource.md)，主服仅保留与居住、交通、轻量装饰相匹配的规模。
- **「家用电器」**：地毯机、小型熔炉组等体量很小的装置可以留在个人基地；整条产线请迁工业服，避免为几台小机器反复跨服。

## **领地与商店**

主服是生存组里**唯一把圈地和买卖都开齐**的世界：

- **领地**：[Residence](/PluginIntroduction/Residence) 只在这里按玩家向规则运作。选区工具默认木锄，选区忽略 Y 轴（按整列高度计费）。默认最多 **8** 块领地、单块水平最大约 **1024×1024**，单价 **0.01🍉 / 方块**。步骤与费用见 [经济系统 · 领地](/SurvivalGuide/EconomicSystem/Residence)。
- **玩家商店**：[QuickShop-Hikari](/SurvivalGuide/EconomicSystem/Shop) 对着容器定价买卖，建议建在自己领地里。
- **系统商店**：[EconomyShopGUI](https://wiki.gpplugins.com/economyshopgui/) 提供分类回收与购买。常用命令：`/shop` 或 `/market` 打开商店，`/sellall`、`/sellgui` 出售；主服把 `/sell` 映射成一键卖光，避免和旧版 Essentials 的 `/sell` 搞混。
- **实体货币**：出生点可把西瓜币兑成 `100` / `1,000` / `10,000` 面额的实体币，便于大额交接，见 [经济系统](/SurvivalGuide/EconomicSystem/)。

## **在线奖励、死亡与日常便利**

- **在线奖励**：每小时 **100🍉**，单日上限 **1,000🍉**；挂机（AFK）不发。工业服更高，见 [赚钱](/SurvivalGuide/EconomicSystem/MakeMoney.md)。
- **死亡箱**：死亡掉落由 [DeathChest](/PluginIntroduction/DeathChest) 接管。默认私人保护 12 小时、再公开 3 天；潜行右键快速取回。费用约「基础 200 + 每级 2 + 每掉落栈 20」，上限 1200。可用 `/dc on`、`/dc off` 开关。
- **假人**：`/bot create <名字>` 创建，前缀 `bot_`，本服上限 10，重启可保留。适合轻量替身，不适合在主城刷怪。详见 [LeavesFakePlayer](/PluginIntroduction/LeavesFakePlayer)。
- **语音 / 坐下**：见总览页的 [Simple Voice Chat](/PluginIntroduction/SimpleVoiceChat) 与 [GSit](/PluginIntroduction/GSit)。
- **投影**：主服开启了 Litematica 相关放置协议，搭建设计图比资源服更省事；仍须遵守规划区与领地规则。

## **交通线路图**

![服务器轨道交通线路图](/assets/cos/2025/03/12/67d149bc7e989.png)

## **卫星地图**

- [Dynmap 平面图](https://map.npucraft.com/dynmap/)
- [BlueMap 三维预览](https://map.npucraft.com/bluemap)

<iframe
src="https://map.npucraft.com/dynmap/"
width="100%"
height="600px"
frameborder="0"
allowfullscreen>
</iframe>
