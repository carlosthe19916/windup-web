import React, { useEffect, useRef, useState } from "react";
import { RouteComponentProps } from "react-router-dom";
import { AxiosPromise } from "axios";

import {
  Stack,
  StackItem,
  Title,
  TitleSizes,
  Alert,
  AlertActionCloseButton,
} from "@patternfly/react-core";

import { FormikHelpers } from "formik";

import { Paths, formatPath, OptionalProjectRoute } from "Paths";
import { ProjectDetailsForm } from "components";
import {
  deleteProvisionalProjects,
  createProject,
  updateProject,
  getProjectById,
  getAnalysisContext,
} from "api/api";
import { MigrationProject, AnalysisContext } from "models/api";

import NewProjectWizard, {
  WizardStepIds,
  LoadingWizardContent,
} from "../wizard";

interface CreateProjectProps
  extends RouteComponentProps<OptionalProjectRoute> {}

export const CreateProject: React.FC<CreateProjectProps> = ({
  match,
  history: { push },
}) => {
  const formRef = useRef<FormikHelpers<any>>();

  const [project, setProject] = useState<MigrationProject>();
  const [analysisContext, setAnalysisContext] = useState<AnalysisContext>();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>();

  const [isFetching, setIsFetching] = useState(true);
  const [fetchError, setFetchError] = useState<string>();

  useEffect(() => {
    deleteProvisionalProjects();
  }, []);

  useEffect(() => {
    if (match.params.project) {
      getProjectById(match.params.project)
        .then(({ data }) => {
          setProject(data);
          return getAnalysisContext(data.defaultAnalysisContextId);
        })
        .then(({ data: analysisContextData }) => {
          setAnalysisContext(analysisContextData);
        })
        .catch(() => {
          setFetchError("Could not fetch migrationProject data");
        })
        .finally(() => {
          setIsFetching(false);
        });
    } else {
      setIsFetching(false);
    }
  }, [match]);

  const handleOnNextStep = () => {
    if (!formRef.current) {
      throw Error("Could not find a reference to form");
    }

    formRef.current.submitForm();
  };

  const handleOnSubmit = (formValue: {
    name: string;
    description?: string;
  }) => {
    setIsSubmitting(true);

    const body: MigrationProject = {
      ...project,
      title: formValue.name.trim(),
      description: formValue.description,
    } as MigrationProject;

    let promise: AxiosPromise<MigrationProject>;
    if (!project) {
      promise = createProject(body);
    } else {
      promise = updateProject(body);
    }

    promise
      .then((project) => {
        push(
          formatPath(Paths.newProject_addApplications, {
            project: project.data.id,
          })
        );
      })
      .catch(() => {
        setSubmitError("Could not create project");
      });
  };

  return (
    <NewProjectWizard
      stepId={WizardStepIds.DETAILS}
      enableNext={true}
      disableNavigation={isFetching || isSubmitting}
      handleOnNextStep={handleOnNextStep}
      migrationProject={project}
      analysisContext={analysisContext}
      showErrorContent={fetchError}
    >
      {isFetching ? (
        <LoadingWizardContent />
      ) : (
        <Stack hasGutter>
          {submitError && (
            <StackItem>
              <Alert
                isLiveRegion
                variant="danger"
                title="Error"
                actionClose={
                  <AlertActionCloseButton onClose={() => setSubmitError("")} />
                }
              >
                {submitError}
              </Alert>
            </StackItem>
          )}
          <StackItem>
            <Title headingLevel="h5" size={TitleSizes["lg"]}>
              Project details
            </Title>
          </StackItem>
          <StackItem>
            <ProjectDetailsForm
              formRef={formRef}
              hideFormControls
              project={project}
              onSubmit={handleOnSubmit}
            />
          </StackItem>
        </Stack>
      )}
    </NewProjectWizard>
  );
};
