import React from "react";
import { RouteComponentProps } from "react-router-dom";
import Moment from "react-moment";

import {
  Card,
  CardTitle,
  CardBody,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
  Stack,
  StackItem,
  Grid,
  GridItem,
  List,
  ListItem,
} from "@patternfly/react-core";
import { ChartBarIcon, DownloadIcon } from "@patternfly/react-icons";

import { getExecution } from "api/api";
import { WindupExecution } from "models/api";

import {
  AdvancedOptionsFieldKey,
  getWindupStaticReportsBase,
  MERGED_CSV_FILENAME,
} from "Constants";
import { ExpandableCard, mapStateToLabel, RulesLabelsList } from "components";

import { ProjectStatusWatcher } from "containers/project-status-watcher";

export interface OverviewProps
  extends RouteComponentProps<{ project: string; execution: string }> {}

export const Overview: React.FC<OverviewProps> = ({ match }) => {
  const [execution, setExecution] = React.useState<WindupExecution>();

  React.useEffect(() => {
    getExecution(match.params.execution).then(({ data: executionData }) => {
      setExecution(executionData);
    });
  }, [match]);

  return (
    <React.Fragment>
      {execution && (
        <Stack hasGutter>
          <StackItem>
            <Grid hasGutter md={6}>
              <GridItem>
                <Card>
                  <CardTitle>Transformation path</CardTitle>
                  <CardBody>
                    <DescriptionList>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Target</DescriptionListTerm>
                        <DescriptionListDescription>
                          {execution.analysisContext.advancedOptions
                            .filter(
                              (f) => f.name === AdvancedOptionsFieldKey.TARGET
                            )
                            .map((f) => f.value)
                            .join(", ")}
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Source</DescriptionListTerm>
                        <DescriptionListDescription>
                          {execution.analysisContext.advancedOptions
                            .filter(
                              (f) => f.name === AdvancedOptionsFieldKey.SOURCE
                            )
                            .map((f) => f.value)
                            .join(", ") || "Not defined"}
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                    </DescriptionList>
                  </CardBody>
                </Card>
              </GridItem>
              <GridItem>
                <Card>
                  <CardTitle>Status</CardTitle>
                  <CardBody>
                    <ProjectStatusWatcher watch={execution}>
                      {({ execution: watchedExecution }) => (
                        <DescriptionList
                          columnModifier={{
                            default: "2Col",
                          }}
                        >
                          <DescriptionListGroup>
                            <DescriptionListTerm>Status</DescriptionListTerm>
                            <DescriptionListDescription>
                              {mapStateToLabel(watchedExecution.state)}
                            </DescriptionListDescription>
                          </DescriptionListGroup>
                          <DescriptionListGroup>
                            <DescriptionListTerm>Started</DescriptionListTerm>
                            <DescriptionListDescription>
                              {watchedExecution.timeStarted ? (
                                <Moment>
                                  {watchedExecution.timeCompleted}
                                </Moment>
                              ) : (
                                "Not yet"
                              )}
                            </DescriptionListDescription>
                          </DescriptionListGroup>
                          <DescriptionListGroup>
                            <DescriptionListTerm>Duration</DescriptionListTerm>
                            <DescriptionListDescription>
                              {watchedExecution.timeStarted ? (
                                <Moment
                                  date={watchedExecution.timeCompleted}
                                  duration={watchedExecution.timeStarted}
                                />
                              ) : (
                                "Waiting to finish"
                              )}
                            </DescriptionListDescription>
                          </DescriptionListGroup>
                          <DescriptionListGroup>
                            <DescriptionListTerm>Reports</DescriptionListTerm>
                            <DescriptionListDescription>
                              {watchedExecution.state === "COMPLETED" ? (
                                <Stack>
                                  <StackItem>
                                    <a
                                      title="Reports"
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      href={`${getWindupStaticReportsBase()}/${
                                        execution.applicationListRelativePath
                                      }`}
                                    >
                                      <ChartBarIcon /> Reports
                                    </a>
                                  </StackItem>
                                  {execution.analysisContext
                                    .generateStaticReports &&
                                    execution.analysisContext.advancedOptions.find(
                                      (f) =>
                                        f.name ===
                                          AdvancedOptionsFieldKey.EXPORT_CSV &&
                                        f.value === "true"
                                    ) && (
                                      <StackItem>
                                        <a
                                          title="Download all issues CSV"
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          href={`${getWindupStaticReportsBase()}/${
                                            execution.id
                                          }/${MERGED_CSV_FILENAME}`}
                                        >
                                          <DownloadIcon /> All issues CSV
                                        </a>
                                      </StackItem>
                                    )}
                                </Stack>
                              ) : (
                                "Not available"
                              )}
                            </DescriptionListDescription>
                          </DescriptionListGroup>
                        </DescriptionList>
                      )}
                    </ProjectStatusWatcher>
                  </CardBody>
                </Card>
              </GridItem>
            </Grid>
          </StackItem>
          <StackItem>
            <Grid hasGutter md={6}>
              <GridItem>
                <ExpandableCard title="Applications">
                  <List>
                    {execution.analysisContext.applications.map(
                      (item, index) => (
                        <ListItem key={index}>{item.inputFilename}</ListItem>
                      )
                    )}
                  </List>
                </ExpandableCard>
              </GridItem>
              <GridItem>
                <ExpandableCard title="Included packages" maxHeight={200}>
                  {execution.analysisContext.includePackages.length > 0 && (
                    <List>
                      {execution.analysisContext.includePackages.map(
                        (item, index) => (
                          <ListItem key={index}>{item.fullName}</ListItem>
                        )
                      )}
                    </List>
                  )}
                  {execution.analysisContext.includePackages.length === 0 && (
                    <span>
                      No packages defined. Default MTA configuration will be
                      applied.
                    </span>
                  )}
                </ExpandableCard>
              </GridItem>
            </Grid>
          </StackItem>
          <StackItem>
            <ExpandableCard title="Custom rules">
              <RulesLabelsList
                items={execution.analysisContext.rulesPaths.map((f) => ({
                  label: f.shortPath || f.path,
                  type: f.rulesPathType,
                  scope: f.scopeType,
                }))}
              />
            </ExpandableCard>
          </StackItem>
          <StackItem>
            <ExpandableCard title="Custom labels">
              <RulesLabelsList
                items={execution.analysisContext.labelsPaths.map((f) => ({
                  label: f.shortPath || f.path,
                  type: f.labelsPathType,
                  scope: f.scopeType,
                }))}
              />
            </ExpandableCard>
          </StackItem>
          <StackItem>
            <ExpandableCard title="Advanced options">
              <table
                role="grid"
                className="pf-c-table pf-m-grid-md pf-m-compact"
                aria-label="This is a simple table example"
              >
                <thead>
                  <tr role="row">
                    <th role="columnheader" scope="col">
                      Option
                    </th>
                    <th role="columnheader" scope="col">
                      Value
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {execution.analysisContext.advancedOptions
                    .filter((f) => {
                      return (
                        f.name !== AdvancedOptionsFieldKey.TARGET &&
                        f.name !== AdvancedOptionsFieldKey.SOURCE
                      );
                    })
                    .map((option, index) => (
                      <tr key={index} role="row">
                        <td role="cell">{option.name}</td>
                        <td role="cell">{option.value}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </ExpandableCard>
          </StackItem>
        </Stack>
      )}
    </React.Fragment>
  );
};
