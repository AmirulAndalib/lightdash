import {
    assertUnreachable,
    DimensionType,
    FieldType,
    SemanticLayerFieldType,
    type RawResultRow,
    type SemanticLayerField,
    type VizColumn,
} from '@lightdash/common';
import { BaseResultsRunner } from '../../queryRunner/BaseResultsRunner';
import { getPivotQueryFunctionForSqlRunner } from '../../queryRunner/sqlRunnerPivotQueries';

const getSemanticLayerFieldTypeFromDimensionType = (
    type: DimensionType,
): SemanticLayerFieldType => {
    switch (type) {
        case DimensionType.STRING:
            return SemanticLayerFieldType.STRING;
        case DimensionType.NUMBER:
            return SemanticLayerFieldType.NUMBER;
        case DimensionType.BOOLEAN:
            return SemanticLayerFieldType.BOOLEAN;
        case DimensionType.DATE:
        case DimensionType.TIMESTAMP:
            return SemanticLayerFieldType.TIME;
        default:
            return assertUnreachable(type, `Unknown field type: ${type}`);
    }
};

export class SqlRunnerResultsRunnerFrontend extends BaseResultsRunner {
    constructor({
        columns,
        rows,
        projectUuid,
        limit,
        sql,
        slug,
        uuid,
    }: {
        columns: VizColumn[];
        rows: RawResultRow[];
        projectUuid: string;
        limit: number;
        sql: string;
        slug?: string;
        uuid?: string;
    }) {
        const fields: SemanticLayerField[] = columns.map((column) => ({
            kind: FieldType.DIMENSION,
            name: column.reference,
            type: getSemanticLayerFieldTypeFromDimensionType(
                column.type || DimensionType.STRING,
            ),
            visible: true,
            label: column.reference,
            // why are these required?
            availableGranularities: [],
            availableOperators: [],
        }));
        super({
            fields,
            rows,
            columnNames: fields.map((field) => field.name),
            runPivotQuery: getPivotQueryFunctionForSqlRunner({
                projectUuid,
                slug,
                uuid,
                limit,
                sql,
                fields,
            }),
        });
    }
}