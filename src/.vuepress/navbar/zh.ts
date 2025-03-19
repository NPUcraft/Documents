import { navbar } from "vuepress-theme-hope";

export const zhNavbar = navbar([
  "/", // 主页
  "/Overview/", // 服务器概览
  "/QuickStart/", // 快速入门
  {
    text: "生存服指南",
    icon: "noto:light-bulb",
    prefix: "/SurvivalGuide/",
    children: [
      "ServerIntroduction/",
      "EconomicSystem/",
      "Support/",
    ],
  },
  "/MachineInstructions/",
  "/PluginInstructions/",


  "/PlayerProfiles/",

  // {
  //   text: "NPUskin",
  //   icon: "book",
  //   link: "https://skin.npucraft.com/",
  // },
]);
