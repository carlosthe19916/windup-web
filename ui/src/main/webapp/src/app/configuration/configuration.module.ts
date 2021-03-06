import {NgModule} from "@angular/core";
import {ConfigurationRulesComponent} from "./configuration-rules/configuration-rules.component";
import {ConfigurationLabelsComponent} from "./configuration-labels/configuration-labels.component";
import {RulesModalComponent} from "./rules-modal.component";
import {ConfigurationResolve} from "./configuration.resolve";
import {ProjectConfigurationResolve} from "./project-configuration.resolve";
import {ConfigurationService} from "./configuration.service";
import {ConfigurationOptionsService} from "./configuration-options.service";
import {RuleService} from "./rule.service";
import {LabelService} from "./label.service";
import {SharedModule} from "../shared/shared.module";
import {RouterModule} from "@angular/router";
import {RuleContentComponent} from "./configuration-rules/rule-content/rule-content.component";
import { RulesListComponent } from "./configuration-rules/rules-list/rules-list.component";
import {LabelContentComponent} from "./configuration-labels/label-content/label-content.component";
import {LabelsListComponent} from "./configuration-labels/labels-list/labels-list.component";

@NgModule({
    imports: [
        SharedModule,
        RouterModule.forChild([])
    ],
    declarations: [
        ConfigurationRulesComponent,
        ConfigurationLabelsComponent,
        RulesModalComponent,
        RuleContentComponent,
        RulesListComponent,
        LabelContentComponent,
        LabelsListComponent
    ],
    exports: [
        ConfigurationRulesComponent,
        ConfigurationLabelsComponent,
        RulesModalComponent,
        RuleContentComponent,
        RulesListComponent,
        LabelContentComponent,
        LabelsListComponent
    ],
    providers: [
        ConfigurationResolve,
        ProjectConfigurationResolve,
        ConfigurationService,
        ConfigurationOptionsService,
        RuleService,
        LabelService
    ]
})
export class ConfigurationModule {
}
