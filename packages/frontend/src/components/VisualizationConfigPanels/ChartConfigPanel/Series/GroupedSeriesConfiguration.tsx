import {
    Colors,
    ControlGroup,
    Divider,
    FormGroup,
    HTMLSelect,
    Switch,
} from '@blueprintjs/core';
import {
    CartesianChartLayout,
    CartesianSeriesType,
    Field,
    formatItemValue,
    getItemId,
    getItemLabel,
    getSeriesId,
    isSeriesWithMixedChartTypes,
    Series,
    TableCalculation,
} from '@lightdash/common';
import React, { FC } from 'react';
import {
    GroupedSeriesConfigWrapper,
    GroupSeriesWrapper,
    SeriesBlock,
} from './Series.styles';
import SingleSeriesConfiguration from './SingleSeriesConfiguration';

const VALUE_LABELS_OPTIONS = [
    { value: 'hidden', label: 'Hidden' },
    { value: 'top', label: 'Top' },
    { value: 'bottom', label: 'Bottom' },
    { value: 'left', label: 'Left' },
    { value: 'right', label: 'Right' },
];

const AXIS_OPTIONS = [
    { value: 0, label: 'Left' },
    { value: 1, label: 'Right' },
];

const FLIPPED_AXIS_OPTIONS = [
    { value: 0, label: 'Bottom' },
    { value: 1, label: 'Top' },
];

const CHART_TYPE_OPTIONS = [
    { value: CartesianSeriesType.BAR, label: 'Bar' },
    { value: CartesianSeriesType.LINE, label: 'Line' },
    { value: CartesianSeriesType.AREA, label: 'Area' },
    { value: CartesianSeriesType.SCATTER, label: 'Scatter' },
];

const getFormatterValue = (
    value: any,
    key: string,
    items: Array<Field | TableCalculation>,
) => {
    const item = items.find((i) => getItemId(i) === key);
    return formatItemValue(item, value);
};

type GroupedSeriesConfigurationProps = {
    layout?: CartesianChartLayout;
    groupedSeries: Record<string, Series[]>;
    items: Array<Field | TableCalculation>;
    getSeriesColor: (key: string) => string | undefined;
    updateAllGroupedSeries: (fieldKey: string, series: Partial<Series>) => void;
    updateSingleSeries: (series: Series) => void;
};

const GroupedSeriesConfiguration: FC<GroupedSeriesConfigurationProps> = ({
    layout,
    groupedSeries,
    items,
    getSeriesColor,
    updateSingleSeries,
    updateAllGroupedSeries,
}) => {
    const [openSeriesId, setOpenSeriesId] = React.useState<
        string | undefined
    >();
    return (
        <ControlGroup vertical>
            {Object.entries(groupedSeries).map(([fieldKey, seriesGroup], i) => {
                const field = items.find(
                    (item) => getItemId(item) === fieldKey,
                );
                if (!field) {
                    return (
                        <SeriesBlock>
                            <span
                                style={{
                                    width: '100%',
                                    color: Colors.GRAY1,
                                }}
                            >
                                Tried to reference field with unknown id:{' '}
                                {fieldKey}
                            </span>
                        </SeriesBlock>
                    );
                }
                const isLabelTheSameForAllSeries: boolean =
                    new Set(seriesGroup.map(({ label }) => label?.position))
                        .size === 1;

                const isAxisTheSameForAllSeries: boolean =
                    new Set(seriesGroup.map(({ yAxisIndex }) => yAxisIndex))
                        .size === 1;

                const isChartTypeTheSameForAllSeries: boolean =
                    !isSeriesWithMixedChartTypes(seriesGroup);

                const hasDivider = layout?.yField?.length !== i + 1;

                const chartType =
                    seriesGroup[0].type === CartesianSeriesType.LINE &&
                    !!seriesGroup[0].areaStyle
                        ? CartesianSeriesType.AREA
                        : seriesGroup[0].type;

                const chartValue = isChartTypeTheSameForAllSeries
                    ? chartType
                    : 'mixed';

                return (
                    <React.Fragment key={fieldKey}>
                        <FormGroup label={`${getItemLabel(field)} (grouped)`}>
                            <ControlGroup fill>
                                <FormGroup
                                    label="Chart type"
                                    labelFor="chart-type-field"
                                >
                                    <HTMLSelect
                                        id="chart-type-field"
                                        fill
                                        value={chartValue}
                                        options={
                                            isChartTypeTheSameForAllSeries
                                                ? CHART_TYPE_OPTIONS
                                                : [
                                                      ...CHART_TYPE_OPTIONS,
                                                      {
                                                          value: 'mixed',
                                                          label: 'Mixed',
                                                      },
                                                  ]
                                        }
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            const newType =
                                                value ===
                                                CartesianSeriesType.AREA
                                                    ? CartesianSeriesType.LINE
                                                    : value;
                                            updateAllGroupedSeries(fieldKey, {
                                                type: newType as Series['type'],
                                                areaStyle:
                                                    value ===
                                                    CartesianSeriesType.AREA
                                                        ? {}
                                                        : undefined,
                                            });
                                        }}
                                    />
                                </FormGroup>

                                <FormGroup label="Axis" labelFor="axis-field">
                                    <HTMLSelect
                                        id="axis-field"
                                        fill
                                        value={
                                            isAxisTheSameForAllSeries
                                                ? seriesGroup[0].yAxisIndex
                                                : 'mixed'
                                        }
                                        options={
                                            isAxisTheSameForAllSeries
                                                ? layout?.flipAxes
                                                    ? FLIPPED_AXIS_OPTIONS
                                                    : AXIS_OPTIONS
                                                : [
                                                      ...(layout?.flipAxes
                                                          ? FLIPPED_AXIS_OPTIONS
                                                          : AXIS_OPTIONS),
                                                      {
                                                          value: 'mixed',
                                                          label: 'Mixed',
                                                      },
                                                  ]
                                        }
                                        onChange={(e) => {
                                            updateAllGroupedSeries(fieldKey, {
                                                yAxisIndex: parseInt(
                                                    e.target.value,
                                                    10,
                                                ),
                                            });
                                        }}
                                    />
                                </FormGroup>

                                <FormGroup
                                    label="Value labels"
                                    labelFor="value-labels-field"
                                >
                                    <HTMLSelect
                                        id="value-labels-field"
                                        fill
                                        value={
                                            isLabelTheSameForAllSeries
                                                ? seriesGroup[0].label
                                                      ?.position || 'hidden'
                                                : 'mixed'
                                        }
                                        options={
                                            isLabelTheSameForAllSeries
                                                ? VALUE_LABELS_OPTIONS
                                                : [
                                                      ...VALUE_LABELS_OPTIONS,
                                                      {
                                                          value: 'mixed',
                                                          label: 'Mixed',
                                                      },
                                                  ]
                                        }
                                        onChange={(e) => {
                                            const option = e.target.value;
                                            updateAllGroupedSeries(fieldKey, {
                                                label:
                                                    option === 'hidden'
                                                        ? {
                                                              show: false,
                                                          }
                                                        : {
                                                              show: true,
                                                              position:
                                                                  option as any,
                                                          },
                                            });
                                        }}
                                    />
                                </FormGroup>
                            </ControlGroup>

                            {(chartValue === CartesianSeriesType.LINE ||
                                chartValue === CartesianSeriesType.AREA) && (
                                <ControlGroup>
                                    <Switch
                                        alignIndicator="right"
                                        checked={
                                            seriesGroup[0].showSymbol ?? true
                                        }
                                        label={'Show symbol'}
                                        onChange={() => {
                                            updateAllGroupedSeries(fieldKey, {
                                                showSymbol: !(
                                                    seriesGroup[0].showSymbol ??
                                                    true
                                                ),
                                            });
                                        }}
                                    />

                                    <Switch
                                        alignIndicator="right"
                                        checked={seriesGroup[0].smooth}
                                        label={'Smooth'}
                                        onChange={() => {
                                            updateAllGroupedSeries(fieldKey, {
                                                smooth: !(
                                                    seriesGroup[0].smooth ??
                                                    true
                                                ),
                                            });
                                        }}
                                    />
                                </ControlGroup>
                            )}

                            <GroupSeriesWrapper>
                                {seriesGroup?.map((singleSeries) => {
                                    const formattedValue = getFormatterValue(
                                        singleSeries.encode.yRef.pivotValues![0]
                                            .value,
                                        singleSeries.encode.yRef.pivotValues![0]
                                            .field,
                                        items,
                                    );
                                    return (
                                        <GroupedSeriesConfigWrapper>
                                            <SingleSeriesConfiguration
                                                key={getSeriesId(singleSeries)}
                                                isCollapsable
                                                layout={layout}
                                                series={singleSeries}
                                                seriesLabel={
                                                    layout?.yField &&
                                                    layout.yField.length > 1
                                                        ? `[${formattedValue}] ${getItemLabel(
                                                              field,
                                                          )}`
                                                        : formattedValue
                                                }
                                                fallbackColor={getSeriesColor(
                                                    getSeriesId(singleSeries),
                                                )}
                                                updateSingleSeries={
                                                    updateSingleSeries
                                                }
                                                isGrouped
                                                isOpen={
                                                    openSeriesId ===
                                                    getSeriesId(singleSeries)
                                                }
                                                toggleIsOpen={() =>
                                                    setOpenSeriesId(
                                                        openSeriesId ===
                                                            getSeriesId(
                                                                singleSeries,
                                                            )
                                                            ? undefined
                                                            : getSeriesId(
                                                                  singleSeries,
                                                              ),
                                                    )
                                                }
                                            />
                                        </GroupedSeriesConfigWrapper>
                                    );
                                })}
                            </GroupSeriesWrapper>
                        </FormGroup>

                        {hasDivider && <Divider />}
                    </React.Fragment>
                );
            })}
        </ControlGroup>
    );
};

export default GroupedSeriesConfiguration;
