import * as React from "react";
import { Bullseye } from "@patternfly/react-core";
import { ThinkPeaksIcon } from "@patternfly/react-icons";

import { Transfer, Tree } from "antd";
import "antd/dist/antd.css";

import { Package } from "../../models/api";

const disaggregatePackages = (
  packages: Package[],
  applicationPackages: Package[],
  thirdPartyPackages: Package[]
): void => {
  for (let i = 0; i < packages.length; i++) {
    const node = packages[i];

    const newNode1 = Object.assign({}, node, { childs: [] });
    const newNode2 = Object.assign({}, node, { childs: [] });

    if (node.known) {
      // If at least one child is unknown, then the node will be part of both Arrays
      if (node.childs && node.childs.some((p) => p.known === false)) {
        applicationPackages.push(newNode1);
        thirdPartyPackages.push(newNode2);
      } else {
        thirdPartyPackages.push(newNode2);
      }
    } else {
      applicationPackages.push(newNode1);
    }

    if (node.childs) {
      disaggregatePackages(node.childs, newNode1.childs, newNode2.childs);
    }
  }
};

const sortPackages = (tree: Package[]): Package[] => {
  tree.forEach((node) => sortPackages(node.childs));
  return tree.sort((a: Package, b: Package) => (a.name > b.name ? 1 : -1));
};

interface TreeNode {
  key: string;
  title: string;
  icon?: React.ReactNode;
  children?: TreeNode[];
}

const packageToTree = (node: Package): TreeNode => {
  return {
    key: node.fullName,
    title: node.name,
    icon: node.known ? <ThinkPeaksIcon /> : undefined,
    children:
      node.childs && node.childs.length > 0
        ? node.childs.map((f) => packageToTree(f))
        : undefined,
  };
};

export interface DualPackageSelectionProps {
  packages: Package[];
  includedPackages: Package[];
  onChange: (includedPackages: string[]) => void;
}

const isChecked = (selectedKeys: string[], eventKey: string) => {
  return selectedKeys.indexOf(eventKey) !== -1;
};

const generateTree = (
  treeNodes: TreeNode[] = [],
  checkedKeys: string[] = []
): any => {
  return treeNodes
    .sort((a, b) => a.key.localeCompare(b.key))
    .map((i: TreeNode) => ({
      ...i,
      disabled:
        checkedKeys.includes(i.key) ||
        checkedKeys.some((f) => i.key.startsWith(f + ".")),
      children: generateTree(i.children, checkedKeys),
    }));
};

const stringCompartor = (a: string, b: string) => a.localeCompare(b);

export const DualPackageSelection: React.FC<DualPackageSelectionProps> = ({
  packages,
  includedPackages,
  onChange,
}) => {
  const [processing, setProcessing] = React.useState(true);

  const [packagesTree, setPackagesTree] = React.useState<TreeNode[]>();
  const [packagesTreeFlattened, setPackagesTreeFlattened] = React.useState<
    TreeNode[]
  >();

  const [targetKeys, setTargetKeys] = React.useState<string[]>([]);

  React.useEffect(() => {
    let newIncludedPackages: Package[];

    if (includedPackages.length === 0) {
      // Set application and third party packages
      const applicationPackages: Package[] = [];
      const thirdPartyPackages: Package[] = [];
      disaggregatePackages(packages, applicationPackages, thirdPartyPackages);

      // Flattern application packages
      const flatteredPackages: Package[] = [];
      const flatternPackages = (nodes: Package[]) => {
        nodes.forEach((node) => {
          // know=false => application party package
          if (node.known === false) {
            flatteredPackages.push(node);
          } else {
            flatternPackages(node.childs);
          }
        });
      };
      flatternPackages(applicationPackages);

      newIncludedPackages = [...flatteredPackages];
    } else {
      newIncludedPackages = [...includedPackages];
    }

    const newTargetKeys = newIncludedPackages
      .map((f) => f.fullName)
      .sort(stringCompartor);

    setTargetKeys(newTargetKeys);

    // Create tree
    const newPackagesTree = packages.map((f) => packageToTree(f));
    setPackagesTree(newPackagesTree);

    // Create flattern tree
    const newPackagesTreeFlattened: TreeNode[] = [];
    const flatten = (list: TreeNode[] = []) => {
      list.forEach((item) => {
        newPackagesTreeFlattened.push(item);
        flatten(item.children);
      });
    };
    flatten(newPackagesTree);
    setPackagesTreeFlattened(newPackagesTreeFlattened);

    // Stop processing signal
    setProcessing(false);
  }, [packages, includedPackages]);

  const handleTransferChange = (keys: string[]) => {
    const keysFlatterned = keys.filter((keyToEliminate) => {
      return !keys.some((i) => keyToEliminate.startsWith(i + "."));
    });

    const newTargetKeys = keysFlatterned.sort(stringCompartor);
    setTargetKeys(newTargetKeys);

    // Emit event
    onChange(newTargetKeys);
  };

  return (
    <React.Fragment>
      {processing ? (
        <Bullseye>
          <span>Processing...</span>
        </Bullseye>
      ) : (
        <Transfer
          titles={["Packages", "Included packages"]}
          dataSource={packagesTreeFlattened}
          render={(item) => item.key}
          showSelectAll={false}
          onChange={handleTransferChange}
          targetKeys={targetKeys} // A set of keys of elements that are listed on the right column
        >
          {({ direction, onItemSelect, selectedKeys }) => {
            if (direction === "left") {
              const checkedKeys = [...selectedKeys, ...targetKeys];
              return (
                <Tree
                  height={350}
                  blockNode // Whether treeNode fill remaining horizontal space
                  checkable // Add a Checkbox before the treeNodes
                  checkStrictly // Check treeNode precisely; parent treeNode and children treeNodes are not associated
                  defaultExpandAll={false} // Whether to expand all treeNodes by default
                  checkedKeys={selectedKeys} // Specifies the keys of the checked treeNodes
                  treeData={generateTree(packagesTree, targetKeys)}
                  onCheck={(_, { node: { key } }) => {
                    onItemSelect(
                      key as any,
                      !isChecked(checkedKeys, key as any)
                    );
                  }}
                  onSelect={(_, { node: { key } }) => {
                    onItemSelect(
                      key as any,
                      !isChecked(checkedKeys, key as any)
                    );
                  }}
                  titleRender={(node) => (
                    <span>
                      {node.title}{" "}
                      <small>
                        <i>{node.icon}</i>
                      </small>
                    </span>
                  )}
                />
              );
            }
          }}
        </Transfer>
      )}
    </React.Fragment>
  );
};
