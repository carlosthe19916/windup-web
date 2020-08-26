import * as React from "react";
import { JsIcon } from "@patternfly/react-icons";

import { Story, Meta } from "@storybook/react/types-6-0";
import { SelectCard, SelectCardProps } from "../select-card";

export default {
  title: "Components / SelectCard",
  component: SelectCard,
  argTypes: {
    onSelect: { action: "clicked" },
  },
} as Meta;

const Template: Story<SelectCardProps> = (args) => <SelectCard {...args} />;

export const Basic = Template.bind({});
Basic.args = {
  label: "Containerization",
  value: "cloud-readiness",
};

export const CustomIcon = Template.bind({});
CustomIcon.args = {
  label: "Javascript",
  value: "javascript",
  icon: JsIcon,
};

export const Multiple = Template.bind({});
Multiple.args = {
  label: "Application server migration to",
  value: [
    {
      label: "JBoss EAP 6",
      value: "eap6",
    },
    {
      label: "JBoss EAP 7",
      value: "eap7",
    },
  ],
};
