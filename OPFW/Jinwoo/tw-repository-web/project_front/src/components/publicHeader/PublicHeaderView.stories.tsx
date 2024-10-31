import type { Meta, StoryObj } from "@storybook/react";
import PublicHeaderView from "./PublicHeaderView";
import { MENU_DATA } from "@/components/MenuData";

const meta: Meta<typeof PublicHeaderView> = {
  title: "Components/PublicHeaderView",
  component: PublicHeaderView,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  argTypes: {
    userName: { control: "text" },
    currentTopMenuKey: { options: Object.values(MENU_DATA) },
  },
  args: {},
};

export default meta;
type Story = StoryObj<typeof PublicHeaderView>;

export const LoggedOut: Story = {
  args: {
    userName: null
  }
}

export const LoggedIn: Story = {
  args: {
    userName: "테스터"
  }
}