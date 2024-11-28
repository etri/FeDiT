import type {Meta, StoryObj} from '@storybook/react';
import {fn} from '@storybook/test';
import Test from './Test';

const meta: Meta<typeof Test> = {
    title: 'Components/Test',
    component: Test,
    parameters: {
        layout: 'fullscreen',
    },
    tags: ['autodocs'],
    argTypes: {},
    args: {
    },
};

export default meta;
type Story = StoryObj<typeof Test>;

export const Primary: Story = {
    args: {},
};