import {
  LayoutBottomIcon,
  AudioWave01Icon,
  CommandIcon,
  ComputerTerminalIcon,
  RoboticIcon,
  BookOpen02Icon,
  Settings05Icon,
  CropIcon,
  PieChartIcon,
  MapsIcon,
  Message,
  SmsCodeIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

export const MENUS = [
  {
    title: "Platform",
    items: [
      {
        title: "Dashboard",
        url: "#",
        icon: <HugeiconsIcon icon={ComputerTerminalIcon} strokeWidth={2} />,
        // items: [
        //   {
        //     title: "History",
        //     url: "#",
        //   },
        //   {
        //     title: "Starred",
        //     url: "#",
        //   },
        //   {
        //     title: "Settings",
        //     url: "#",
        //   },
        // ],
      },
      {
        title: "Bots",
        url: "/bots",
        icon: <HugeiconsIcon icon={RoboticIcon} strokeWidth={2} />,
        items: [
          {
            title: "List",
            url: "/bots",
          },
          {
            title: "Create",
            url: "/bots/create",
          },
        ],
      },
      {
        title: "Knowledge Base",
        url: "#",
        icon: <HugeiconsIcon icon={BookOpen02Icon} strokeWidth={2} />,
        items: [
          {
            title: "List",
            url: "#",
          },
          {
            title: "Create",
            url: "#",
          },
        ],
      },
      {
        title: "Conversations",
        url: "#",
        icon: <HugeiconsIcon icon={Message} strokeWidth={2} />,
      },
    ],
  },
  {
    title: "Control",
    items: [
      {
        title: "Widget",
        url: "/widget",
        icon: <HugeiconsIcon icon={SmsCodeIcon} strokeWidth={2} />,
      },
      {
        title: "Settings",
        url: "#",
        icon: <HugeiconsIcon icon={Settings05Icon} strokeWidth={2} />,
      },
    ],
  },
];
