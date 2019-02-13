import {HttpClient} from "@angular/common/http";
import {Constants} from "../../constants";
import {AbstractService} from "../../shared/abtract.service";
import {Observable} from "rxjs";
import {Category, FilterApplication, ReportFilter, Tag, WindupExecution} from "../../generated/windup-services";
import {Injectable} from "@angular/core";
import { map, catchError } from 'rxjs/operators';

@Injectable()
export class ReportFilterService extends AbstractService {
    protected FILTER_URL = '/executions/{executionId}/filter';
    protected TAGS_URL = '/executions/{executionId}/filter/tags';
    protected CATEGORIES_URL = '/executions/{executionId}/filter/categories';
    protected FILTER_APPLICATIONS_URL = '/executions/{executionId}/filter/applications';

    public constructor(private _http: HttpClient) {
        super();
    }

    getFilter(execution: WindupExecution): Observable<ReportFilter> {
        let url = Constants.REST_BASE + this.FILTER_URL.replace('{execId}', execution.id.toString());

        return this._http.get<ReportFilter>(url)
            .pipe(
                catchError(this.handleError)
            );
    }

    clearFilter(execution: WindupExecution): Observable<ReportFilter> {
        let url = Constants.REST_BASE + this.FILTER_URL.replace('{execId}', execution.id.toString());

        return this._http.delete<ReportFilter>(url)
            .pipe(
                catchError(this.handleError)
            );
    }

    updateFilter(execution: WindupExecution, filter: any): Observable<ReportFilter> {
        let url = Constants.REST_BASE + this.FILTER_URL.replace('{execId}', execution.id.toString());

        return this._http.put<ReportFilter>(url, filter)
            .pipe(
                catchError(this.handleError)
            );
    }

    getTags(execution: WindupExecution): Observable<Tag[]> {
        let url = Constants.REST_BASE + this.TAGS_URL.replace('{execId}', execution.id.toString());

        return this._http.get<Tag[]>(url)
            .pipe(
                catchError(this.handleError)
            );
    }

    getCategories(execution: WindupExecution): Observable<Category[]> {
        let url = Constants.REST_BASE + this.CATEGORIES_URL.replace('{execId}', execution.id.toString());

        return this._http.get<Category[]>(url)
            .pipe(
                catchError(this.handleError)
            );
    }

    getFilterApplications(execution: WindupExecution): Observable<FilterApplication[]>
    {
        let url = Constants.REST_BASE + this.FILTER_APPLICATIONS_URL
                .replace('{execId}', execution.id.toString())
                .replace('{executionId}', execution.id.toString());

        return this._http.get<FilterApplication[]>(url)
            .pipe(
                catchError(this.handleError)
            );
    }
}
