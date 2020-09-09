import * as React from "react";
import { Schema } from "@data-driven-forms/react-form-renderer";
import FormRenderer from "@data-driven-forms/react-form-renderer/dist/cjs/form-renderer";
import FormTemplate from "@data-driven-forms/pf4-component-mapper/dist/cjs/form-template";
import componentTypes from "@data-driven-forms/react-form-renderer/dist/cjs/component-types";
import validatorTypes from "@data-driven-forms/react-form-renderer/dist/cjs/validator-types";
import componentMapper from "@data-driven-forms/pf4-component-mapper/dist/cjs/component-mapper";

interface Form {
  name: string;
  description?: string;
}

export interface ProjectDetailsFormDDFProps {
  initialValues?: Form;
  showFormControls?: boolean;
  searchProjectByName: (name: string) => Promise<any>;
  onHandleChange?: (values: any, isValid: boolean) => void;
  onSubmit: (value: any) => void;
  onCancel?: () => void;
}

export const ProjectDetailsFormDDF: React.FC<ProjectDetailsFormDDFProps> = ({
  initialValues,
  showFormControls,
  searchProjectByName,
  onHandleChange,
  onSubmit,
  onCancel,
}) => {
  const asyncNameValidator = (value: string) =>
    searchProjectByName(value)
      .then((response: any) => {
        if (response && response.data) {
          const error = { message: "The entered name is already in use" };
          throw error;
        }
      })
      .catch((error) => {
        throw error && error.message
          ? error.message
          : "There was an error validating 'name'";
      });

  const schema: Schema = {
    fields: [
      {
        name: "project",
        component: componentTypes.SUB_FORM,
        title: "Project details",
        fields: [
          {
            name: "name",
            label: "Name",
            helperText: "A unique name for the project",
            component: componentTypes.TEXT_FIELD,
            isRequired: true,
            validate: [
              asyncNameValidator,
              {
                type: validatorTypes.REQUIRED,
              },
              {
                type: validatorTypes.MIN_LENGTH,
                threshold: 3,
              },
            ],
            resolveProps: (
              props: any,
              { meta, input }: any,
              formOptions: any
            ) => {
              if (meta.valid) {
              }
              return {};
            },
          },
          {
            name: "description",
            label: "Description",
            helperText: "A short description of the project",
            component: componentTypes.TEXTAREA,
            isRequired: false,
            validate: [],
          },
        ],
      },
    ],
  };

  return (
    <FormRenderer
      schema={schema}
      componentMapper={componentMapper}
      FormTemplate={(props) => (
        <FormTemplate {...props} showFormControls={showFormControls} />
      )}
      onSubmit={onSubmit}
      onCancel={onCancel}
      initialValues={initialValues}
      debug={({ values, valid, validating }) => {
        // if (onHandleChange) {
        //   onHandleChange(values, valid && !validating);
        // }
      }}
    />
  );
};