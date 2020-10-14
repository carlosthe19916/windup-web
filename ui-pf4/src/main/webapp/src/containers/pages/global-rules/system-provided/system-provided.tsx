import React, { useCallback, useEffect, useState } from "react";

import {
  Bullseye,
  Button,
  ButtonVariant,
  Checkbox,
  Chip,
  ChipGroup,
  Select,
  SelectOption,
  SelectVariant,
  Split,
  SplitItem,
  ToolbarGroup,
  ToolbarItem,
} from "@patternfly/react-core";
import { IActions, ICell, IRow, sortable } from "@patternfly/react-table";
import { CubesIcon, FilterIcon } from "@patternfly/react-icons";

import "./system-provided.scss";

import { CustomEmptyState, TableSectionOffline } from "components";
import { useFetchRules } from "hooks/useFetchRules";

import { RuleProviderEntity, RulesPath } from "models/api";
import { getTechnologyAsString } from "utils/modelUtils";

const RULE_PROVIDER_ENTITY_FIELD = "rulePath";

type TargetSource = "target" | "source";

const columns: ICell[] = [
  { title: "Provider ID", transforms: [sortable] },
  { title: "Source", transforms: [] },
  { title: "Target", transforms: [] },
  { title: "Number of rules", transforms: [sortable] },
];

const compareRulePath = (
  a: RuleProviderEntity,
  b: RuleProviderEntity,
  columnIndex?: number
) => {
  switch (columnIndex) {
    case 0: // Provider ID
      return a.providerID.localeCompare(b.providerID);
    case 3: // Number of rules
      return a.rules.length - b.rules.length;
    default:
      return 0;
  }
};

const filterRulePath = (filterText: string, item: RuleProviderEntity) => {
  return item.providerID.toLowerCase().includes(filterText.toLowerCase());
};

const getSystemProvidedRuleProviderEntities = (
  rulesPath?: RulesPath[],
  ruleProviders?: Map<RulesPath, RuleProviderEntity[]>
) => {
  const systemProvidedRulesPath = rulesPath?.find(
    (f) => f.rulesPathType === "SYSTEM_PROVIDED"
  );
  if (systemProvidedRulesPath) {
    return ruleProviders?.get(systemProvidedRulesPath);
  }
};

const getAllTechnologyVersions = (
  ruleProviderEntities: RuleProviderEntity[],
  type: TargetSource
) => {
  return ruleProviderEntities.reduce((map, item) => {
    let technologies = item.targets;
    if (type === "target") {
      technologies = item.targets;
    } else if (type === "source") {
      technologies = item.sources;
    } else {
      throw new Error("Expected 'source' or 'target'");
    }

    technologies.forEach((technology) => {
      let versions: string[] = [];
      if (technology.versionRange && technology.versionRange.length > 0) {
        versions = technology.versionRange
          //eslint-disable-next-line
          .replace(/[(\[\])]/g, "")
          .split(",")
          .filter((version) => version !== "");
      }

      const newVersions = new Set(map.get(technology.name));
      versions.forEach((f) => newVersions.add(f));

      map.set(technology.name, newVersions);
    });

    return map;
  }, new Map<string, Set<string>>());
};

export const SystemProvided: React.FC = () => {
  const [tableData, setTableData] = useState<RuleProviderEntity[]>();
  const [allSystemProviders, setAllSystemProviders] = useState<
    RuleProviderEntity[]
  >();
  const [showAllRules, setShowAllRules] = useState(false);

  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [selectedTargets, setSelectedTargets] = useState<string[]>([]);

  const {
    rulesPath,
    ruleProviders,
    isFetching,
    fetchError,
    loadGlobalRules,
  } = useFetchRules();

  useEffect(() => {
    loadGlobalRules();
  }, [loadGlobalRules]);

  useEffect(() => {
    const systemProviders = getSystemProvidedRuleProviderEntities(
      rulesPath,
      ruleProviders
    );
    setAllSystemProviders(systemProviders);
  }, [rulesPath, ruleProviders]);

  useEffect(() => {
    if (rulesPath && ruleProviders) {
      const newTableData = getSystemProvidedRuleProviderEntities(
        rulesPath,
        ruleProviders
      )
        //showAllRules
        ?.filter((f) => {
          return showAllRules ? true : f.phase === "MIGRATIONRULESPHASE";
        })
        // Source filter
        .filter((f) => {
          if (selectedSources.length === 0) {
            return true;
          }

          const allTechnologies = getAllTechnologyVersions([f], "source");
          const technologyVersionArray = technologyVersionToSelecValues(
            allTechnologies
          );

          return selectedSources.some((source) =>
            technologyVersionArray.includes(source)
          );
        })
        // Target filter
        .filter((f) => {
          if (selectedTargets.length === 0) {
            return true;
          }

          const allTechnologies = getAllTechnologyVersions([f], "target");
          const technologyVersionArray = technologyVersionToSelecValues(
            allTechnologies
          );

          return selectedTargets.some((source) =>
            technologyVersionArray.includes(source)
          );
        })
        .slice()
        .sort((a, b) => {
          return a.providerID.localeCompare(b.providerID);
        });

      setTableData(newTableData);
    }
  }, [
    rulesPath,
    ruleProviders,
    showAllRules,
    selectedSources,
    selectedTargets,
  ]);

  const actions: IActions = [];

  const rulePathToIRow = useCallback(
    (ruleProviderEntity: RuleProviderEntity[]): IRow[] => {
      return ruleProviderEntity.map((item) => {
        return {
          props: {
            [RULE_PROVIDER_ENTITY_FIELD]: item,
          },
          cells: [
            {
              title: item.providerID,
            },
            {
              title: item.sources
                .map((f) => getTechnologyAsString(f))
                .join(", "),
            },
            {
              title: item.targets
                .map((f) => getTechnologyAsString(f))
                .join(", "),
            },
            {
              title: item.rules.length,
            },
          ],
        };
      });
    },
    []
  );

  const toggleShowAllRules = (selected: boolean) => {
    setShowAllRules(selected);
  };

  const handleOnSourcesChange = (values: string[]) => {
    setSelectedSources(values);
  };

  const handleOnTargetsChange = (values: string[]) => {
    setSelectedTargets(values);
  };

  const removeSource = (selection: string) => {
    if (selectedSources.includes(selection)) {
      setSelectedSources((current) => current.filter((f) => f !== selection));
    } else {
      setSelectedSources((current) => [...current, selection]);
    }
  };
  const removeTarget = (selection: string) => {
    if (selectedTargets.includes(selection)) {
      setSelectedTargets((current) => current.filter((f) => f !== selection));
    } else {
      setSelectedTargets((current) => [...current, selection]);
    }
  };
  const clearAllSources = () => {
    setSelectedSources([]);
  };
  const clearAllTargets = () => {
    setSelectedTargets([]);
  };
  const clearAllFilters = () => {
    clearAllSources();
    clearAllTargets();
  };

  return (
    <TableSectionOffline
      items={tableData || []}
      columns={columns}
      actions={actions}
      loadingVariant="skeleton"
      isLoadingData={isFetching || !tableData}
      loadingDataError={fetchError}
      compareItem={compareRulePath}
      filterItem={filterRulePath}
      mapToIRow={rulePathToIRow}
      hideFilterText={true}
      filterTextPlaceholder="Filter by provider ID"
      toolbar={
        <>
          {allSystemProviders && (
            <>
              <SourceTargetFilterToolbarGroup
                ruleProviders={allSystemProviders}
                selectedSources={selectedSources}
                selectedTargets={selectedTargets}
                onSelectedSourcesChange={handleOnSourcesChange}
                onSelectedTargetsChange={handleOnTargetsChange}
              />
              <ToolbarGroup variant="icon-button-group">
                <ToolbarItem>
                  <Checkbox
                    id="showAllRules"
                    name="showAllRules"
                    label="Show all rules"
                    isChecked={showAllRules}
                    onChange={toggleShowAllRules}
                    aria-label="show all rules"
                  />
                </ToolbarItem>
              </ToolbarGroup>
            </>
          )}
        </>
      }
      filters={
        selectedSources.length + selectedTargets.length > 0 && (
          <>
            <ToolbarGroup>
              <Split hasGutter>
                <SplitItem>
                  <ChipGroup
                    categoryName="Source"
                    isClosable
                    onClick={clearAllSources}
                  >
                    {selectedSources.map((currentChip) => (
                      <Chip
                        key={currentChip}
                        onClick={() => removeSource(currentChip)}
                      >
                        {currentChip}
                      </Chip>
                    ))}
                  </ChipGroup>
                </SplitItem>
                <SplitItem>
                  <ChipGroup
                    categoryName="Target"
                    isClosable
                    onClick={clearAllTargets}
                  >
                    {selectedTargets.map((currentChip) => (
                      <Chip
                        key={currentChip}
                        onClick={() => removeTarget(currentChip)}
                      >
                        {currentChip}
                      </Chip>
                    ))}
                  </ChipGroup>
                </SplitItem>
              </Split>
            </ToolbarGroup>
            <ToolbarItem>
              <Button variant={ButtonVariant.link} onClick={clearAllFilters}>
                Clear all filters
              </Button>
            </ToolbarItem>
          </>
        )
      }
      emptyState={
        <Bullseye>
          <CustomEmptyState
            icon={CubesIcon}
            title="No sytem provided rules available"
            body="Make sure your server contains system provided rules"
          />
        </Bullseye>
      }
    />
  );
};

const technologyVersionToSelecValues = (map: Map<string, Set<string>>) => {
  const result: string[] = [];
  map.forEach((versions, technology) => {
    result.push(technology);
    versions.forEach((version) => {
      result.push(`${technology} ${version}`);
    });
  });
  return result;
};

const buildSecondSelectOption = (technologyVersion: string) => {
  return <SelectOption key={technologyVersion} value={technologyVersion} />;
};

export interface SourceTargetFilterToolbarGroupProps {
  ruleProviders: RuleProviderEntity[];
  selectedSources: string[];
  selectedTargets: string[];
  onSelectedSourcesChange: (values: string[]) => void;
  onSelectedTargetsChange: (values: string[]) => void;
}

export const SourceTargetFilterToolbarGroup: React.FC<SourceTargetFilterToolbarGroupProps> = ({
  ruleProviders,
  selectedSources,
  selectedTargets,
  onSelectedSourcesChange,
  onSelectedTargetsChange,
}) => {
  // First filter

  const [firstFilterValue, setFirstFilterValue] = useState<TargetSource>(
    "source"
  );
  const [isFirstFilterOpen, setIsFirstFilterOpen] = useState(false);

  const onFirstFilterToggle = (isExpanded: boolean) => {
    setIsFirstFilterOpen(isExpanded);
  };
  const onFirstFilterSelect = (_: any, selection: any) => {
    setFirstFilterValue(selection);
    setIsFirstFilterOpen(false);

    setSecondFilter_filterText("");
  };

  // Second Filter

  const [secondFilter_filterText, setSecondFilter_filterText] = useState("");
  const [secondFilterOptions, setSecondFilterOptions] = useState<string[]>([]);
  useEffect(() => {
    const technologyVersionMap = getAllTechnologyVersions(
      ruleProviders,
      firstFilterValue
    );
    const technologyVersionArray = technologyVersionToSelecValues(
      technologyVersionMap
    )
      .slice()
      .sort((a, b) => a.localeCompare(b));
    const technologyVersionArrayFiltered = technologyVersionArray.filter((f) =>
      f.toLocaleLowerCase().includes(secondFilter_filterText.toLowerCase())
    );

    setSecondFilterOptions(technologyVersionArrayFiltered);
  }, [firstFilterValue, secondFilter_filterText, ruleProviders]);

  const [isSecondFilterOpen, setIsSecondFilterOpen] = useState(false);

  const onSecondFilterToggle = (isExpanded: boolean) => {
    setIsSecondFilterOpen(isExpanded);

    if (isExpanded) {
      setSecondFilter_filterText("");
    }
  };
  const onSecondFilterSelect = (_: any, selection: any) => {
    let values: string[];
    let callbackFn: (values: string[]) => void;

    if (firstFilterValue === "source") {
      values = selectedSources;
      callbackFn = onSelectedSourcesChange;
    } else if (firstFilterValue === "target") {
      values = selectedTargets;
      callbackFn = onSelectedTargetsChange;
    } else {
      throw Error("firstFilterValue must be 'source' or 'target'");
    }

    if (values.includes(selection)) {
      callbackFn(values.filter((f) => f !== selection));
    } else {
      callbackFn([...values, selection]);
    }
  };
  const onSecondFilter_Filter = (evt: any) => {
    setSecondFilter_filterText(evt.target.value);
    return secondFilterOptions.map(buildSecondSelectOption);
  };

  return (
    <ToolbarGroup variant="filter-group">
      <ToolbarItem>
        <Select
          variant={SelectVariant.single}
          aria-label="Select Filter"
          onToggle={onFirstFilterToggle}
          onSelect={onFirstFilterSelect}
          selections={firstFilterValue}
          isOpen={isFirstFilterOpen}
          toggleIcon={<FilterIcon />}
        >
          {[
            <SelectOption key="source" value="source" />,
            <SelectOption key="target" value="target" />,
          ]}
        </Select>
      </ToolbarItem>
      <ToolbarItem>
        <Select
          variant={SelectVariant.checkbox}
          onToggle={onSecondFilterToggle}
          onSelect={onSecondFilterSelect}
          selections={
            firstFilterValue === "source" ? selectedSources : selectedTargets
          }
          isOpen={isSecondFilterOpen}
          placeholderText={`Filter by ${firstFilterValue}`}
          aria-labelledby={`Filter by ${firstFilterValue}`}
          onFilter={onSecondFilter_Filter}
          hasInlineFilter
          className="SourceTargetFilterToolbarGroup"
        >
          {secondFilterOptions.map((technologyVersion) => (
            <SelectOption key={technologyVersion} value={technologyVersion} />
          ))}
        </Select>
      </ToolbarItem>
    </ToolbarGroup>
  );
};