import React, { useEffect, useState } from "react";
import { RouteComponentProps } from "react-router-dom";
import { useDispatch } from "react-redux";

import { alertActions } from "store/alert";

import { PackageSelection, PackageSelectionLoadingState } from "components";

import { useFetchProjectPackages } from "hooks/useFetchProjectPackages";

import { getAlertModel } from "Constants";
import { Paths, formatPath } from "Paths";
import { AnalysisContext } from "models/api";
import { getAnalysisContext, saveAnalysisContext } from "api/api";
import {
  fullNameToPackage as mapFullNamesToPackages,
  getUnknownPackages,
} from "utils/packageUtils";

import NewProjectWizard, { WizardStepIds } from "../wizard";

interface SelectPackagesProps
  extends RouteComponentProps<{ project: string }> {}

export const SelectPackages: React.FC<SelectPackagesProps> = ({
  match,
  history: { push },
}) => {
  const dispatch = useDispatch();

  const {
    project,
    analysisContext,
    packages,
    applicationPackages,
    isFetching,
    fetchError,
  } = useFetchProjectPackages(match.params.project);

  const [selectedPackages, setSelectedPackages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (analysisContext && applicationPackages) {
      let newSelectedPackages = analysisContext.includePackages;
      if (newSelectedPackages.length === 0) {
        newSelectedPackages = getUnknownPackages(applicationPackages);
      }
      setSelectedPackages(newSelectedPackages.map((f) => f.fullName));
    }
  }, [analysisContext, applicationPackages]);

  const handleOnSelectedPackagesChange = (value: string[]) => {
    setSelectedPackages(value);
  };

  const handleOnUndo = () => {
    const newSelectedPackages = getUnknownPackages(applicationPackages || []);
    setSelectedPackages(newSelectedPackages.map((f) => f.fullName));
  };

  const handleOnNextStep = () => {
    // If packages are still being loaded no need to wait, we can jump to next step
    if (isFetching) {
      push(
        formatPath(Paths.newProject_customRules, {
          project: project?.id,
        })
      );
    } else {
      onSubmit();
    }
  };

  const onSubmit = () => {
    if (!project || !packages) {
      return;
    }

    setIsSubmitting(true);
    getAnalysisContext(project.defaultAnalysisContextId)
      .then(({ data }) => {
        const newAnalysisContext: AnalysisContext = {
          ...data,
          includePackages: mapFullNamesToPackages(selectedPackages, packages),
        };
        return saveAnalysisContext(project.id, newAnalysisContext);
      })
      .then(() => {
        push(
          formatPath(Paths.newProject_customRules, {
            project: project.id,
          })
        );
      })
      .catch(() => {
        setIsSubmitting(false);
        dispatch(
          alertActions.alert(
            getAlertModel("danger", "Error", "Could not save data")
          )
        );
      });
  };

  return (
    <NewProjectWizard
      stepId={WizardStepIds.SELECT_PACKAGES}
      enableNext={isFetching || selectedPackages.length > 0}
      disableNavigation={isSubmitting}
      handleOnNextStep={handleOnNextStep}
      migrationProject={project}
      analysisContext={analysisContext}
      showErrorContent={fetchError}
    >
      <PackageSelection
        packages={packages || []}
        selectedPackages={selectedPackages}
        onSelectedPackagesChange={handleOnSelectedPackagesChange}
        onUndo={handleOnUndo}
        isFetching={isFetching}
        isFetchingPlaceholder={<PackageSelectionLoadingState />}
      />
    </NewProjectWizard>
  );
};
