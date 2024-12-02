import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import ButtonView from "./ButtonView";
import {buttonCategories, buttonLevels, buttonSizes} from "../constants";

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta: Meta<typeof ButtonView> = {
  title: "Components/ButtonView",
  component: ButtonView,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: "centered",
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ["autodocs"],
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  argTypes: {
    text: {control: "text"},
    isDisabled: {control: "boolean"}
  },
  // Use `fn` to spy on the onClick arg, which will appear in the actions panel once invoked: https://storybook.js.org/docs/essentials/actions#action-args
  args: { onClick: fn() },
};

export default meta;
type Story = StoryObj<typeof ButtonView>;

export const primaryButton: Story = {
  args: {
    text: "Primary",
    level: buttonLevels.primary,
    category: buttonCategories.info
  },
};

export const secondaryButton: Story = {
  args: {
    text: "Secondary",
    level: buttonLevels.secondary,
    category: buttonCategories.info
  },
};

export const tertiaryButton: Story = {
  args: {
    text: "Tertiary",
    level: buttonLevels.tertiary,
    category: buttonCategories.info
  },
};
