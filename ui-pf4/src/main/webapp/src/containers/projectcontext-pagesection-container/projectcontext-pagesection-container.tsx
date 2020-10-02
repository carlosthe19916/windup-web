import React from "react";
import { useSelector, useDispatch } from "react-redux";

import { Form, FormGroup } from "@patternfly/react-core";

import "./projectcontext-pagesection-container.scss";

import { ProjectContextSelector, ProjectContextPageSection } from "components";

import { Project } from "models/api";

import { RootState } from "store/rootReducer";
import {
  projectContextSelectors,
  projectContextActions,
} from "store/projectContext";

export interface ProjectContextPageSectionContainer {
  projectIdRouteParam: string;
  onProjectContextChange: (project: Project) => void;
}

export const ProjectContextPageSectionContainer: React.FC<ProjectContextPageSectionContainer> = ({
  projectIdRouteParam,
  onProjectContextChange,
}) => {
  const dispatch = useDispatch();

  const projects = useSelector((state: RootState) =>
    projectContextSelectors.projects(state)
  );
  const selectedProject = useSelector((state: RootState) =>
    projectContextSelectors.selectedProject(state)
  );

  React.useEffect(() => {
    const newSelectedProject = projects.find(
      (f) => f.migrationProject.id.toString() === projectIdRouteParam
    );
    if (newSelectedProject) {
      dispatch(projectContextActions.selectProjectContext(newSelectedProject));
    }
  }, [projectIdRouteParam, projects, dispatch]);

  React.useEffect(() => {
    dispatch(projectContextActions.fetchProjectsContext());
  }, [dispatch]);

  return (
    <ProjectContextPageSection>
      <Form
        isHorizontal
        className="pf-c-form_projectcontext-pagesection-container"
      >
        <FormGroup label="Project:" fieldId="project">
          <ProjectContextSelector
            projects={projects}
            selectedProject={selectedProject}
            onSelectProject={onProjectContextChange}
          />
        </FormGroup>
      </Form>
    </ProjectContextPageSection>
  );
};
