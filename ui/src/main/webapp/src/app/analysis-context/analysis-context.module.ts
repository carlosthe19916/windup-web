import {NgModule} from "@angular/core";
import {AnalysisContextService} from "./analysis-context.service";
import {AnalysisContextFormComponent} from "./analysis-context-form.component";
import {CustomRuleSelectionComponent} from "./custom-rule-selection.component";
import {MigrationPathService} from "./migration-path.service";
import {PackageRegistryService} from "./package-registry.service";
import {AnalysisContextAdvancedOptionsModalComponent} from "./analysis-context-advanced-options-modal.component";
import {SharedModule} from "../shared/shared.module";
import {RouterModule} from "@angular/router";
import {SelectApplicationsComponent} from "./select-applications.component";
import {TransformationPathsComponent} from "./transformation-paths.component";
import {SelectPackagesComponent} from "./select-packages/select-packages.component";
import {SelectPackagesWrapperComponent} from "./select-packages/select-packages-wrapper.component";
import {SelectPackagesSummaryComponent} from "./select-packages/select-packages-summary.component";
import {TableModule} from "patternfly-ng/table";
import {ListModule} from "patternfly-ng/list";
import {ToolbarModule} from "patternfly-ng/toolbar";
import {ActionModule} from "patternfly-ng/action";
import {TabsModule, TabsetConfig} from "ngx-bootstrap/tabs";
import {ModalModule} from "ngx-bootstrap/modal";
import {CustomRulesComponent} from "./custom-rules/custom-rules.component";
import {UploadedRulesPathComponent} from "./custom-rules/uploaded-rules-path.component";
import {ServerPathRulesComponent} from "./custom-rules/server-path-rules.component";
import {UploadedRulePathModalComponent} from "./custom-rules/uploaded-rule-path-modal.component";
import {ServerPathRulesModalComponent} from "./custom-rules/server-path-rules-modal.component";
import {RulesListComponent} from "./custom-rules/rules-list.component";
import {RulesComponent} from "./custom-rules/rules.component";

@NgModule({
    imports: [
        SharedModule,
        RouterModule.forChild([]),
        TableModule,
        ListModule,
        ToolbarModule,
        ActionModule,
        TabsModule,
        ModalModule
    ],
    declarations: [
        AnalysisContextFormComponent,
        AnalysisContextAdvancedOptionsModalComponent,
        CustomRuleSelectionComponent,
        SelectApplicationsComponent,
        TransformationPathsComponent,

        SelectPackagesComponent,
        SelectPackagesWrapperComponent,
        SelectPackagesSummaryComponent,

        CustomRulesComponent,
        UploadedRulesPathComponent,
        ServerPathRulesComponent,
        UploadedRulePathModalComponent,
        ServerPathRulesModalComponent,
        RulesListComponent,
        RulesComponent
    ],
    exports: [
        AnalysisContextFormComponent,
        AnalysisContextAdvancedOptionsModalComponent,
        CustomRuleSelectionComponent,
        SelectApplicationsComponent,
        TransformationPathsComponent,

        SelectPackagesComponent,
        SelectPackagesWrapperComponent,
        SelectPackagesSummaryComponent,

        RulesListComponent,
        RulesComponent
    ],
    providers: [
        AnalysisContextService,
        MigrationPathService,
        PackageRegistryService,
        TabsetConfig
    ],
    entryComponents: [
        UploadedRulePathModalComponent,
        ServerPathRulesModalComponent
    ]
})
export class AnalysisContextModule {
}