import * as yup from "yup";

import { AdvancedOptionsFieldKey } from "Constants";
import { getMapKeys } from "utils/utils";

import {
  AdvancedOption,
  AnalysisContext,
  ConfigurationOption,
} from "models/api";
import { validateAdvancedOptionValue } from "api/api";

type FieldType = "dropdown" | "input" | "switch";

export interface IFieldInfo {
  label: string;
  type: FieldType;
}

export const Fields: Map<AdvancedOptionsFieldKey, IFieldInfo> = new Map([
  // Dropdowns
  [
    AdvancedOptionsFieldKey.TARGET,
    {
      label: "Target",
      type: "dropdown",
    },
  ],
  [
    AdvancedOptionsFieldKey.SOURCE,
    {
      label: "Source",
      type: "dropdown",
    },
  ],
  [
    AdvancedOptionsFieldKey.INCLUDE_TAGS,
    {
      label: "Include tags",
      type: "dropdown",
    },
  ],
  [
    AdvancedOptionsFieldKey.EXCLUDE_TAGS,
    {
      label: "Exclude tags",
      type: "dropdown",
    },
  ],

  // Input fields
  [
    AdvancedOptionsFieldKey.ADDITIONAL_CLASSPATH,
    {
      label: "Additional classpath",
      type: "input",
    },
  ],
  [
    AdvancedOptionsFieldKey.APPLICATION_NAME,
    {
      label: "Application name",
      type: "input",
    },
  ],
  [
    AdvancedOptionsFieldKey.MAVENIZE_GROUP_ID,
    {
      label: "Mavenize group ID",
      type: "input",
    },
  ],
  [
    AdvancedOptionsFieldKey.IGNORE_PATH,
    {
      label: "Ignore path",
      type: "input",
    },
  ],

  // Switch
  [
    AdvancedOptionsFieldKey.EXPORT_CSV,
    {
      label: "Export CSV",
      type: "switch",
    },
  ],
  [
    AdvancedOptionsFieldKey.TATTLETALE,
    {
      label: "Tattletale",
      type: "switch",
    },
  ],
  [
    AdvancedOptionsFieldKey.CLASS_NOT_FOUND_ANALYSIS,
    {
      label: "'Class Not Found' analysis",
      type: "switch",
    },
  ],
  [
    AdvancedOptionsFieldKey.COMPATIBLE_FILES_REPORT,
    {
      label: "'Compatible Files' report",
      type: "switch",
    },
  ],
  [
    AdvancedOptionsFieldKey.EXPLODED_APP,
    {
      label: "Exploded app",
      type: "switch",
    },
  ],
  [
    AdvancedOptionsFieldKey.KEEP_WORK_DIRS,
    {
      label: "Keep work dirs",
      type: "switch",
    },
  ],
  [
    AdvancedOptionsFieldKey.SKIP_REPORTS,
    {
      label: "Skip reports",
      type: "switch",
    },
  ],
  [
    AdvancedOptionsFieldKey.ALLOW_NETWORK_ACCESS,
    {
      label: "Allow network access",
      type: "switch",
    },
  ],
  [
    AdvancedOptionsFieldKey.MAVENIZE,
    {
      label: "Mavenize",
      type: "switch",
    },
  ],
  [
    AdvancedOptionsFieldKey.SOURCE_MODE,
    {
      label: "Source mode",
      type: "switch",
    },
  ],
]);

// Schema

export const buildSchema = (availableOptions: ConfigurationOption[]) => {
  const schema: any = {};

  getMapKeys(Fields).forEach((fieldKey: AdvancedOptionsFieldKey) => {
    const [fieldInfo, fieldConfiguration] = getFieldData(
      fieldKey,
      Fields,
      availableOptions
    );

    switch (fieldInfo.type) {
      case "dropdown":
        schema[fieldKey] = yup.array().nullable();
        break;
      case "input":
        schema[fieldKey] = yup.string().nullable().trim();
        break;
      case "switch":
        schema[fieldKey] = yup.boolean().nullable();
        break;
    }

    let fieldSchema:
      | yup.ArraySchema<any>
      | yup.StringSchema<any>
      | yup.BooleanSchema<any> = schema[fieldKey];
    if (fieldConfiguration.required) {
      schema[fieldKey] = fieldSchema.required();
    }

    fieldSchema = schema[fieldKey];
    schema[fieldKey] = fieldSchema.test(
      "invalidValue",
      "The entered name is invalid.",
      (value) => {
        if (!value) return true;

        let values: any[];
        if (typeof value === "string" || typeof value === "boolean") {
          values = [value];
        } else if (Array.isArray(value)) {
          values = value;
        } else {
          throw Error("Invalid type, can not validate:" + value);
        }

        return Promise.all(
          values.map((f) =>
            validateAdvancedOptionValue({
              name: fieldKey,
              value: f,
            } as AdvancedOption)
          )
        )
          .then((responses) => {
            const isValid = responses.every((f) => f.data.level === "SUCCESS");

            return !isValid
              ? new yup.ValidationError(
                  responses.map((f) => f.data.message),
                  value,
                  fieldKey
                )
              : true;
          })
          .catch(() => false);
      }
    );
  });

  return yup.object().shape(schema);
};

// Initial values
export const buildInitialValues = (
  analysisContext: AnalysisContext,
  availableOptions: ConfigurationOption[]
) => {
  let result: any = {};

  getMapKeys(Fields).forEach((fieldKey: AdvancedOptionsFieldKey) => {
    const [fieldInfo] = getFieldData(fieldKey, Fields, availableOptions);

    const dbValues = analysisContext.advancedOptions.filter(
      (f) => f.name === fieldKey
    );

    switch (fieldInfo.type) {
      case "dropdown":
        result = {
          ...result,
          [fieldKey]: dbValues.map((f) => f.value) || [],
        };
        break;
      case "input":
        result = {
          ...result,
          [fieldKey]: dbValues.map((f) => f.value).join(" ") || "",
        };
        break;
      case "switch":
        result = {
          ...result,
          [fieldKey]: dbValues.reduce(
            (prev, { value }) => prev || value === "true",
            false
          ),
        };
        break;
    }
  });

  return result;
};

// Utils
export const filterFieldsByType = (
  type: FieldType,
  fields: Map<AdvancedOptionsFieldKey, IFieldInfo>
) => {
  return Array.from(fields.keys()).filter((f) => fields.get(f)?.type === type);
};

export const getFieldData = (
  key: AdvancedOptionsFieldKey,
  fields: Map<AdvancedOptionsFieldKey, IFieldInfo>,
  availableOptions: ConfigurationOption[]
): [IFieldInfo, ConfigurationOption] => {
  const fieldInfo = fields.get(key);
  const fieldConfiguration = availableOptions.find((f) => f.name === key);

  if (!fieldConfiguration || !fieldInfo) {
    throw Error("FieldKey=" + key + " doesn't match available option");
  }

  return [fieldInfo, fieldConfiguration];
};