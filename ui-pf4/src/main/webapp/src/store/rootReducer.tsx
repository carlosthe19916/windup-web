import { combineReducers } from "redux";
import { StateType } from "typesafe-actions";

import { deleteDialogStateKey, deleteDialogReducer } from "./deleteDialog";
import { executionsStateKey, executionsReducer } from "./executions";
import {
  projectContextStateKey,
  projectContextReducer,
} from "./projectContext";
import { projectListStateKey, projectListReducer } from "./projectList";

const frontendComponentsNotifications = require("@redhat-cloud-services/frontend-components-notifications");

export type RootState = StateType<typeof rootReducer>;

export const rootReducer = combineReducers({
  [deleteDialogStateKey]: deleteDialogReducer,
  [executionsStateKey]: executionsReducer,
  [projectContextStateKey]: projectContextReducer,
  [projectListStateKey]: projectListReducer,
  notifications: frontendComponentsNotifications.notifications,
});
