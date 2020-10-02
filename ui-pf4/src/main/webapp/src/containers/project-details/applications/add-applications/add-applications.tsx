import React from "react";
import { RouteComponentProps } from "react-router-dom";

import {
  Button,
  ModalVariant,
  PageSection,
  Modal,
} from "@patternfly/react-core";

import { AddApplicationsForm, SimplePageSection } from "components";

import { formatPath, Paths } from "Paths";
import { Application, MigrationProject } from "models/api";
import {
  getProjectById,
  pathTargetType,
  registerApplicationByPath,
  registerApplicationInDirectoryByPath,
} from "api/api";
import { AxiosPromise } from "axios";

export interface AddApplicationsProps
  extends RouteComponentProps<{ project: string }> {}

export const AddApplications: React.FC<AddApplicationsProps> = ({
  match,
  history,
}) => {
  const [project, setProject] = React.useState<MigrationProject>();
  const [, setProjectIsFeching] = React.useState(true);
  const [, setProjectFetchError] = React.useState("");

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [, setSubmitError] = React.useState<string>();

  const [formValue, setFormValue] = React.useState<{
    activeTabKey?: number;
    tab0?: {
      applications: Application[];
    };
    tab1?: {
      serverPath?: string;
      isServerPathExploded?: boolean;
    };
  }>();

  React.useEffect(() => {
    getProjectById(match.params.project)
      .then(({ data }) => {
        setProject(data);
      })
      .catch(() => {
        setProjectFetchError("Error while fetching project");
      })
      .finally(() => {
        setProjectIsFeching(false);
      });
  }, [match]);

  const handleOnFormChange = React.useCallback(
    (value: {
      activeTabKey?: number;
      tab0?: {
        applications: Application[];
      };
      tab1?: {
        serverPath?: string;
        isServerPathExploded?: boolean;
      };
    }) => {
      setFormValue(value);
    },
    []
  );

  const handleOnSave = () => {
    if (!formValue || formValue.activeTabKey === 0) {
      handleOnModalClose();
    }

    if (formValue && formValue.activeTabKey === 1) {
      setIsSubmitting(true);

      pathTargetType(formValue.tab1?.serverPath!)
        .then(({ data }) => {
          let registerServerPathPromise: AxiosPromise<Application>;

          if (data === "DIRECTORY" && !formValue.tab1?.isServerPathExploded) {
            registerServerPathPromise = registerApplicationInDirectoryByPath(
              project!.id,
              formValue.tab1?.serverPath!
            );
          } else {
            registerServerPathPromise = registerApplicationByPath(
              project!.id,
              formValue.tab1?.serverPath!,
              formValue.tab1?.isServerPathExploded!
            );
          }

          return registerServerPathPromise;
        })
        .then(() => {
          handleOnModalClose();
        })
        .catch((error) => {
          setIsSubmitting(false);
          setSubmitError(
            error?.response?.data?.message
              ? error.response.data.message
              : "It was not possible to register the path due to an error."
          );
        });
    }
  };

  const handleOnModalClose = () => {
    history.push(
      formatPath(Paths.editProject_applications, {
        project: match.params.project,
      })
    );
  };

  return (
    <React.Fragment>
      <SimplePageSection title="Applications" />
      <PageSection>
        <Modal
          variant={ModalVariant.medium}
          title="Add applications"
          isOpen={true}
          onClose={handleOnModalClose}
          actions={[
            <Button
              key="save"
              variant="primary"
              onClick={handleOnSave}
              isDisabled={isSubmitting}
            >
              Save
            </Button>,
            <Button key="close" variant="link" onClick={handleOnModalClose}>
              Close
            </Button>,
          ]}
        >
          {project && (
            <AddApplicationsForm
              projectId={project.id}
              onChange={handleOnFormChange}
            />
          )}
        </Modal>
      </PageSection>
    </React.Fragment>
  );
};