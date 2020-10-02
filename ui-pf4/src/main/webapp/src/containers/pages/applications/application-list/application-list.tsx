import React, { useState, useEffect, useCallback } from "react";
import { RouteComponentProps } from "react-router-dom";
import { useDispatch } from "react-redux";
import Moment from "react-moment";

import {
  Bullseye,
  Button,
  PageSection,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
  ToolbarItemVariant,
} from "@patternfly/react-core";
import {
  IActions,
  ICell,
  IRow,
  ISortBy,
  sortable,
  SortByDirection,
} from "@patternfly/react-table";
import { InfoIcon } from "@patternfly/react-icons";

import { deleteDialogActions } from "store/deleteDialog";

import {
  CustomEmptyState,
  FetchTable,
  FilterToolbarItem,
  SimplePageSection,
  SimplePagination,
} from "components";

import { getWindupRestBase } from "Constants";
import { Application, MigrationProject } from "models/api";
import {
  deleteRegisteredApplication,
  DOWNLOAD_REGISTERED_APPLICATION,
  getProjectById,
} from "api/api";
import { formatPath, Paths } from "Paths";

export interface ApplicationListProps
  extends RouteComponentProps<{ project: string }> {}

export const ApplicationList: React.FC<ApplicationListProps> = ({
  match,
  history,
}) => {
  const [project, setProject] = useState<MigrationProject>();
  const [isFetching, setIsFetching] = useState(true);
  const [fetchError, setFetchError] = useState("");

  // Redux
  const dispatch = useDispatch();

  // Table props
  const [tableData, setTableData] = useState<Application[]>([]);

  const [filterText, setFilterText] = useState("");
  const [paginationmatch, setPaginationParams] = useState({
    page: 1,
    perPage: 10,
  });
  const [sortBy, setSortBy] = useState<ISortBy>();
  const [rows, setRows] = useState<IRow[]>();

  const columns: ICell[] = [
    { title: "Application", transforms: [sortable] },
    { title: "Date added", transforms: [sortable] },
  ];
  const actions: IActions = [
    {
      title: "Delete",
      onClick: (_, rowIndex: number) => {
        const row = tableData![rowIndex];
        dispatch(
          deleteDialogActions.openModal({
            name: `#${row.title}`,
            type: "application",
            onDelete: () => {
              dispatch(deleteDialogActions.processing());
              deleteRegisteredApplication(row.id)
                .then(() => {
                  refreshMigrationProject();
                })
                .finally(() => {
                  dispatch(deleteDialogActions.closeModal());
                });
            },
            onCancel: () => {
              dispatch(deleteDialogActions.closeModal());
            },
          })
        );
      },
    },
  ];

  const refreshMigrationProject = useCallback(() => {
    if (match.params.project) {
      setIsFetching(true);
      getProjectById(match.params.project)
        .then(({ data }) => {
          setProject(data);
        })
        .catch(() => {
          setFetchError("Error while fetching project");
        })
        .finally(() => {
          setIsFetching(false);
        });
    } else {
      setIsFetching(false);
      setFetchError("Undefined ProjectId, can't fetch data");
    }
  }, [match]);

  useEffect(() => {
    refreshMigrationProject();
  }, [refreshMigrationProject]);

  useEffect(() => {
    if (project) {
      // Sort
      let sortedArray = [...project.applications].sort((a, b) => b.id - a.id);
      const columnSortIndex = sortBy?.index;
      const columnSortDirection = sortBy?.direction;
      switch (columnSortIndex) {
        case 0: // Application
          sortedArray.sort((a, b) => a.title.localeCompare(b.title));
          break;
        case 1: // Date added
          sortedArray.sort((a, b) => a.lastModified - b.lastModified);
          break;
      }
      if (columnSortDirection === SortByDirection.desc) {
        sortedArray = sortedArray.reverse();
      }
      // Filter
      const filteredArray = sortedArray.filter(
        (p) => p.title.toLowerCase().indexOf(filterText.toLowerCase()) !== -1
      );
      setTableData(filteredArray);
      const rows: IRow[] = filteredArray.map((item) => {
        return {
          cells: [
            {
              title: (
                <a
                  href={`${getWindupRestBase()}/${DOWNLOAD_REGISTERED_APPLICATION}/${
                    item.id
                  }`}
                >
                  {item.title}
                </a>
              ),
            },
            {
              title: <Moment fromNow>{item.lastModified}</Moment>,
            },
          ],
        };
      });
      // Paginate
      const paginatedRows = rows.slice(
        (paginationmatch.page - 1) * paginationmatch.perPage,
        paginationmatch.page * paginationmatch.perPage
      );
      setRows(paginatedRows);
    }
  }, [project, filterText, paginationmatch, sortBy, match]);

  // Table handlers

  const handlFilterTextChange = (filterText: string) => {
    const newParams = { page: 1, perPage: paginationmatch.perPage };
    setFilterText(filterText);
    setPaginationParams(newParams);
  };

  const handlePaginationChange = ({
    page,
    perPage,
  }: {
    page: number;
    perPage: number;
  }) => {
    setPaginationParams({ page, perPage });
  };

  //

  const handleAddApplication = () => {
    history.push(
      formatPath(Paths.addApplications, {
        project: match.params.project,
      })
    );
  };

  return (
    <>
      <SimplePageSection title="Applications" />
      <PageSection>
        {project?.applications?.length === 0 && (
          <Bullseye>
            <CustomEmptyState
              icon={InfoIcon}
              title="There are no applications in this project"
              body="Upload an application by clicking in the button below."
              primaryAction={["Add application", handleAddApplication]}
              secondaryActions={[]}
            />
          </Bullseye>
        )}
        {project && project.applications.length > 0 && (
          <>
            <Toolbar>
              <ToolbarContent>
                <FilterToolbarItem
                  searchValue={filterText}
                  onFilterChange={handlFilterTextChange}
                  placeholder="Filter by name"
                />
                <ToolbarGroup variant="button-group">
                  <ToolbarItem>
                    <Button type="button" onClick={handleAddApplication}>
                      Add application
                    </Button>
                  </ToolbarItem>
                </ToolbarGroup>
                <ToolbarItem
                  variant={ToolbarItemVariant.pagination}
                  alignment={{ default: "alignRight" }}
                >
                  <SimplePagination
                    count={tableData.length}
                    params={paginationmatch}
                    isTop={true}
                    onChange={handlePaginationChange}
                  />
                </ToolbarItem>
              </ToolbarContent>
            </Toolbar>
            <FetchTable
              columns={columns}
              rows={rows}
              actions={actions}
              fetchStatus={isFetching ? "inProgress" : "complete"}
              fetchError={fetchError}
              loadingVariant="skeleton"
              onSortChange={(sortBy: ISortBy) => {
                setSortBy(sortBy);
              }}
            />
            <SimplePagination
              count={tableData.length}
              params={paginationmatch}
              onChange={handlePaginationChange}
            />
          </>
        )}
      </PageSection>
    </>
  );
};
