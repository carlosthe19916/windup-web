import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {AbstractService} from "../../shared/abtract.service";
import {Constants} from "../../constants";
import {GraphJSONToModelService} from "./graph-json-to-model.service";
import {ClassificationModel} from "../../generated/tsModels/ClassificationModel";
import { map, catchError } from 'rxjs/operators';

@Injectable()
export class ClassificationService extends AbstractService {

    constructor(private _http: HttpClient, private _graphJsonToModelService: GraphJSONToModelService<any>) {
        super();
    }

    getClassificationsForFile(executionId: number, fileModelID: number): Observable<ClassificationModel[]> {
        let url = `${Constants.GRAPH_REST_BASE}/graph/classifications/${executionId}/by-file/${fileModelID}`;
        let service = this._graphJsonToModelService;

        return this._http.get<ClassificationModel[]>(url)
            .pipe(
                map(res => <ClassificationModel[]>res.map((json) => service.fromJSON(json, ClassificationModel))),
                catchError(this.handleError)
            );
    }
}
