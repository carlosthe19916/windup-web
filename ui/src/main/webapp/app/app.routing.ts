import { Routes, RouterModule } from '@angular/router';
import {ProjectListComponent} from "./components/projectlist.component";
import {GroupListComponent} from "./components/grouplist.component";
import {RegisterApplicationFormComponent} from "./components/registerapplicationform.component";
import {MigrationProjectFormComponent} from "./components/migrationprojectform.component";
import {ApplicationGroupForm} from "./components/applicationgroupform.component";
import {AnalysisContextFormComponent} from "./components/analysiscontextform.component";
import {ConfigurationComponent} from "./components/configuration.component";

const appRoutes: Routes = [
    {path:"", redirectTo: "/project-list", pathMatch: "full"},
    {path:"configuration", component: ConfigurationComponent, data: { displayName: "Windup Configuration" }},
    {path:"project-list", component: ProjectListComponent, data: { displayName: "Project List" }},
    {path:"group-list", component: GroupListComponent, data: {displayName: "Group List"}},
    {path:"register-application", component: RegisterApplicationFormComponent, data: {displayName: "Application Registration"}},
    {path:"migration-project-form", component: MigrationProjectFormComponent, data: {displayName: "Edit Project"}},
    {path:"application-group-form", component: ApplicationGroupForm, data: {displayName: "Edit Application Group"}},
    {path:"analysis-context-form", component: AnalysisContextFormComponent, data: {displayName: "Edit Analysis Context"}},

];

export const appRoutingProviders: any[] = [

];

export const routing = RouterModule.forRoot(appRoutes);