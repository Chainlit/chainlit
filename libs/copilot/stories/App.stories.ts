import type { Meta, StoryObj } from '@storybook/react';
import AppWrapper from 'appWrapper';

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
  title: 'Example/App',
  component: AppWrapper,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: 'centered'
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  argTypes: {}
} satisfies Meta<typeof AppWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Primary: Story = {
  args: {
    widgetConfig: {
      chainlitServer: 'http://localhost:8000'
    }
  }
};

export const Secondary: Story = {
  args: {
    widgetConfig: {
      chainlitServer: 'http://localhost:8000',
      theme: 'dark',
      button: {
        imageUrl:
          'https://steelbluemedia.com/wp-content/uploads/2019/06/new-google-favicon-512.png',
      }
    }
  }
};
