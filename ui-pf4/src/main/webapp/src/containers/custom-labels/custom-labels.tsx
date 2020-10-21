import React, { useCallback, useEffect, useState } from "react";
import { AxiosError } from "axios";

import {
  Stack,
  StackItem,
  Title,
  TitleSizes,
  TextContent,
  Text,
  Button,
  ToolbarGroup,
  ToolbarItem,
  Switch,
  Modal,
  ModalVariant,
  Bullseye,
} from "@patternfly/react-core";
import {
  ICell,
  sortable,
  IRow,
  IRowData,
  IAction,
  ISeparator,
} from "@patternfly/react-table";
import { CubesIcon } from "@patternfly/react-icons";

import {
  AddRuleLabelTabs,
  TableSectionOffline,
  CustomEmptyState,
  RulelabelTitle,
} from "components";

import { useFetchProject } from "hooks/useFetchProject";
import { useFetchLabels } from "hooks/useFetchLabels/useFetchLabels";
import { useDeleteLabel } from "hooks/useDeleteLabel";
import { useShowRuleLabelDetails } from "hooks/useShowRuleLabelDetails";

import { useDispatch } from "react-redux";
import { alertActions } from "store/alert";

import { getAlertModel } from "Constants";
import { getAnalysisContext, saveAnalysisContext } from "api/api";
import { LabelsPath, LabelProviderEntity } from "models/api";
import {
  getAxiosErrorMessage,
  getErrorsFromLabelProviderEntity,
  getNumberOfLabelsFromLabelProviderEntity,
} from "utils/modelUtils";

const LABELPATH_FIELD = "labelPath";

const columns: ICell[] = [
  { title: "Short path", transforms: [sortable] },
  { title: "Number of labels", transforms: [] },
  { title: "Enable", transforms: [] },
];

const compareLabelPath = (
  a: LabelsPath,
  b: LabelsPath,
  columnIndex?: number
) => {
  switch (columnIndex) {
    case 0: // Short path
      return (a.shortPath || a.path).localeCompare(b.shortPath || b.path);
    default:
      return 0;
  }
};

const filterLabelPath = (filterText: string, labelPath: LabelsPath) => {
  return (
    (labelPath.shortPath || labelPath.path)
      .toLowerCase()
      .indexOf(filterText.toLowerCase()) !== -1
  );
};

interface CustomLabelsProps {
  projectId: string | number;
  skipChangeToProvisional: boolean;
}

export const CustomLabels: React.FC<CustomLabelsProps> = ({
  projectId,
  skipChangeToProvisional,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const dispatch = useDispatch();
  const deleteLabel = useDeleteLabel();
  const showRuleLabelDetails = useShowRuleLabelDetails();

  const {
    project,
    analysisContext,
    isFetching: isFetchingProject,
    fetchError: fetchProjectError,
    loadProject,
  } = useFetchProject();

  const {
    labelsPath,
    labelProviders,
    isFetching: isFetchingLabels,
    fetchError: fetchLabelsError,
    loadLabels,
  } = useFetchLabels();

  useEffect(() => {
    loadProject(projectId);
    loadLabels(projectId);
  }, [projectId, loadProject, loadLabels]);

  const handleLabelPathToggled = useCallback(
    (isChecked: boolean, labelPathToggled: LabelsPath) => {
      if (!project) {
        return;
      }

      getAnalysisContext(project.defaultAnalysisContextId)
        .then(({ data }) => {
          const newAnalysisContext = { ...data };

          if (isChecked) {
            newAnalysisContext.labelsPaths = [
              ...newAnalysisContext.labelsPaths,
              labelPathToggled,
            ];
          } else {
            newAnalysisContext.labelsPaths = newAnalysisContext.labelsPaths.filter(
              (f) => f.id !== labelPathToggled.id
            );
          }

          return saveAnalysisContext(
            project.id,
            newAnalysisContext,
            skipChangeToProvisional
          );
        })
        .then(() => {
          loadProject(project.id);
        })
        .catch((error: AxiosError) => {
          dispatch(
            alertActions.alert(
              getAlertModel("danger", "Error", getAxiosErrorMessage(error))
            )
          );
        });
    },
    [project, skipChangeToProvisional, loadProject, dispatch]
  );

  const actionResolver = (rowData: IRowData): (IAction | ISeparator)[] => {
    const row: LabelsPath = getRowLabelPathField(rowData);
    const labelProviderEntity = labelProviders?.get(row.id) || [];
    const numberOfRules = getNumberOfLabelsFromLabelProviderEntity(
      labelProviderEntity
    );

    const viewDetailsAction: IAction = {
      title: "View details",
      onClick: (_, rowIndex: number, rowData: IRowData) => {
        const row: LabelsPath = getRowLabelPathField(rowData);
        const labelProviderEntity = labelProviders?.get(row.id) || [];

        showRuleLabelDetails("Label", row, labelProviderEntity);
      },
    };

    return [
      ...(numberOfRules > 0 ? [viewDetailsAction] : []),
      {
        title: "Delete",
        onClick: (_, rowIndex: number, rowData: IRowData) => {
          const row: LabelsPath = getRowLabelPathField(rowData);
          deleteLabel(row, () => loadLabels(projectId));
        },
      },
    ];
  };

  const areActionsDisabled = (): boolean => {
    return false;
  };

  const getRowLabelPathField = (rowData: IRowData): LabelsPath => {
    return rowData[LABELPATH_FIELD];
  };

  const labelPathToIRow = useCallback(
    (labelPaths: LabelsPath[]): IRow[] => {
      return labelPaths.map((item) => {
        const labelProviderEntity: LabelProviderEntity[] =
          labelProviders?.get(item.id) || [];

        const numberOfLabels = getNumberOfLabelsFromLabelProviderEntity(
          labelProviderEntity
        );

        const errors = getErrorsFromLabelProviderEntity(labelProviderEntity);

        return {
          [LABELPATH_FIELD]: item,
          cells: [
            {
              title: (
                <RulelabelTitle
                  name={item.shortPath || item.path}
                  errors={errors}
                  numberOfRulesLabels={numberOfLabels}
                />
              ),
            },
            {
              title: numberOfLabels,
            },
            {
              title: (
                <Switch
                  aria-label="Enabled"
                  isChecked={
                    !!analysisContext?.labelsPaths.find((f) => f.id === item.id)
                  }
                  onChange={(isChecked) =>
                    handleLabelPathToggled(isChecked, item)
                  }
                  isDisabled={errors.length > 0 || numberOfLabels === 0}
                />
              ),
            },
          ],
        };
      });
    },
    [analysisContext, labelProviders, handleLabelPathToggled]
  );

  const handleModalToggle = () => {
    setIsModalOpen((current) => {
      if (current) {
        loadLabels(projectId);
      }
      return !current;
    });
  };

  const handleOnLabelLabelClose = () => {
    setIsModalOpen((current) => !current);
    loadLabels(projectId);
  };

  return (
    <>
      <Modal
        variant={ModalVariant.medium}
        title="Add labels"
        isOpen={isModalOpen}
        onClose={handleModalToggle}
      >
        <AddRuleLabelTabs
          type="Label"
          projectId={projectId}
          onSubmitFinishedServerPath={handleOnLabelLabelClose}
          onCancelServerPath={handleOnLabelLabelClose}
        />
      </Modal>

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
        <StackItem>
          <TableSectionOffline
            items={labelsPath}
            columns={columns}
            actionResolver={actionResolver}
            areActionsDisabled={areActionsDisabled}
            loadingVariant="skeleton"
            isLoadingData={isFetchingProject || isFetchingLabels}
            loadingDataError={fetchProjectError || fetchLabelsError}
            compareItem={compareLabelPath}
            filterItem={filterLabelPath}
            mapToIRow={labelPathToIRow}
            toolbar={
              <ToolbarGroup variant="button-group">
                <ToolbarItem>
                  <Button type="button" onClick={handleModalToggle}>
                    Add label
                  </Button>
                </ToolbarItem>
              </ToolbarGroup>
            }
            emptyState={
              <Bullseye>
                <CustomEmptyState
                  icon={CubesIcon}
                  title="No custom labels available"
                  body="Upload a custom label by clicking on 'Add label'"
                />
              </Bullseye>
            }
          />
        </StackItem>
      </Stack>
    </>
  );
};
