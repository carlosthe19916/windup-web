import React, { lazy, Suspense } from "react";
import { Switch, Route, RouteComponentProps } from "react-router-dom";
import { useDispatch } from "react-redux";

import { PageSection, Label } from "@patternfly/react-core";

import { deleteDialogActions } from "store/deleteDialog";

import { Paths, formatPath } from "Paths";
import { deleteExecution, getExecution } from "api/api";
import { WindupExecution } from "models/api";

import {
  PageHeader,
  mapStateToLabel,
  mapStateToIcon,
  AppPlaceholder,
} from "components";

import { ProjectStatusWatcher } from "containers/project-status-watcher";

const Overview = lazy(() => import("./overview"));
const Logs = lazy(() => import("./logs"));

export interface ExecutionDetailsProps
  extends RouteComponentProps<{ project: string; execution: string }> {}

export const ExecutionDetails: React.FC<ExecutionDetailsProps> = ({
  match,
  history: { push },
}) => {
  const [execution, setExecution] = React.useState<WindupExecution>();

  const dispatch = useDispatch();

  const handleDeleteExecution = () => {
    if (!execution) {
      return;
    }

    dispatch(
      deleteDialogActions.openModal({
        name: `#${execution.id.toString()}`,
        type: "analysis",
        onDelete: () => {
          dispatch(deleteDialogActions.processing);
          deleteExecution(execution.id).then(() => {
            dispatch(deleteDialogActions.closeModal());
            push(
              formatPath(Paths.editProject_executionList, {
                project: match.params.project,
              })
            );
          });
        },
        onCancel: () => {
          dispatch(deleteDialogActions.closeModal());
        },
      })
    );
  };

  React.useEffect(() => {
    getExecution(match.params.execution).then(({ data: executionData }) => {
      setExecution(executionData);
    });
  }, [match]);

  return (
    <React.Fragment>
      <PageHeader
        title={`Analysis #${execution?.id}`}
        resourceStatus={
          execution ? (
            <ProjectStatusWatcher watch={execution}>
              {({ execution: watchedExecution }) => (
                <Label icon={mapStateToIcon(watchedExecution.state)}>
                  {mapStateToLabel(watchedExecution.state)}
                </Label>
              )}
            </ProjectStatusWatcher>
          ) : undefined
        }
        breadcrumbs={[
          {
            title: "Executions",
            path: formatPath(Paths.editProject_executionList, {
              project: match.params.project,
            }),
          },
          {
            title: "Details",
            path: formatPath(Paths.editProject_executionDetails, {
              project: match.params.project,
              execution: match.params.execution,
            }),
          },
        ]}
        menuActions={[{ label: "Delete", callback: handleDeleteExecution }]}
        navItems={[
          {
            title: "Details",
            path: formatPath(Paths.editProject_executionDetails_overview, {
              project: match.params.project,
              execution: match.params.execution,
            }),
          },
          // {
          //   title: "Applications",
          //   path: formatPath(
          //     Paths.editProject_executionDetails_applications,
          //     {
          //       project: match.params.project,
          //       execution: match.params.execution,
          //     }
          //   ),
          // },
          // {
          //   title: "Rules",
          //   path: formatPath(Paths.editProject_executionDetails_rules, {
          //     project: match.params.project,
          //     execution: match.params.execution,
          //   }),
          // },
          {
            title: "Logs",
            path: formatPath(Paths.editProject_executionDetails_logs, {
              project: match.params.project,
              execution: match.params.execution,
            }),
          },
        ]}
      />
      <PageSection>
        <Suspense fallback={<AppPlaceholder />}>
          <Switch>
            <Route
              path={Paths.editProject_executionDetails_overview}
              component={Overview}
            />
            <Route
              path={Paths.editProject_executionDetails_logs}
              component={Logs}
            />
          </Switch>
        </Suspense>
      </PageSection>
    </React.Fragment>
  );
};