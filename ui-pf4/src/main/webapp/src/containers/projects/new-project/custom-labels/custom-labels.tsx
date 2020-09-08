import React from "react";
import { RouteComponentProps } from "react-router-dom";
import {
  Stack,
  StackItem,
  Title,
  TitleSizes,
  TextContent,
  Text,
} from "@patternfly/react-core";

import { MigrationProject } from "models/api";

import NewProjectWizard from "../";
import { WizardStepIds, LoadingWizardContent } from "../new-project-wizard";
import { getProjectById } from "api/api";

interface CustomLabelsProps extends RouteComponentProps<{ project: string }> {}

export const CustomLabels: React.FC<CustomLabelsProps> = ({ match }) => {
  const [project, setProject] = React.useState<MigrationProject>();

  const [processing, setProcessing] = React.useState(true);
  const [, setError] = React.useState<string>();

  React.useEffect(() => {
    getProjectById(match.params.project)
      .then(({ data: projectData }) => {
        setProject(projectData);
      })
      .catch(() => {
        setError("Could not fetch migrationProject data");
      })
      .finally(() => {
        setProcessing(false);
      });
  }, [match]);

  const handleOnNextStep = () => {
    // push(
    //   formatPath(Paths.newProject_addApplications, {
    //     project: project?.id,
    //   })
    // );
  };

  return (
    <NewProjectWizard
      stepId={WizardStepIds.CUSTOM_LABELS}
      enableNext={true}
      isDisabled={false}
      handleOnNextStep={handleOnNextStep}
      migrationProject={project}
    >
      {processing ? (
        <LoadingWizardContent />
      ) : (
        <Stack hasGutter>
          <StackItem>
            <TextContent>
              <Title headingLevel="h5" size={TitleSizes["lg"]}>
                Custom labels
              </Title>
              <Text component="small">
                Upload the labels you want yo include in the analysis
              </Text>
            </TextContent>
          </StackItem>
          <StackItem>Custom labels</StackItem>
        </Stack>
      )}
    </NewProjectWizard>
  );
};
