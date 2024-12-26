import { assertUnreachable } from '@lightdash/common';
import { Button, SegmentedControl, Select, Stack, Text } from '@mantine/core';
import { IconDownload } from '@tabler/icons-react';
import { type EChartsInstance } from 'echarts-for-react';
import React, { useCallback, useState } from 'react';

import MantineIcon from '../MantineIcon';
import {
    base64SvgToBase64Image,
    downloadImage,
    downloadJson,
    downloadPdf,
    DownloadType,
} from './chartDownloadUtils';

type DownloadOptions = {
    getChartInstance: () => EChartsInstance | undefined;
    unavailableOptions?: DownloadType[];
};

const ChartDownloadOptions: React.FC<DownloadOptions> = ({
    getChartInstance,
    unavailableOptions,
}) => {
    const [type, setType] = useState<DownloadType>(DownloadType.PNG);
    const [isBackgroundTransparent, setIsBackgroundTransparent] =
        useState(false);

    const onDownload = useCallback(async () => {
        const chartInstance = getChartInstance();
        if (!chartInstance) {
            console.error('Chart instance is not available');
            return;
        }

        try {
            const svgBase64 = chartInstance.getDataURL();
            const width = chartInstance.getWidth();
            const height = chartInstance.getHeight();

            switch (type) {
                case DownloadType.PDF:
                    downloadPdf(
                        await base64SvgToBase64Image(svgBase64, width),
                        width,
                        height,
                    );
                    break;
                case DownloadType.SVG:
                    downloadImage(svgBase64);
                    break;
                case DownloadType.JPEG:
                    downloadImage(
                        await base64SvgToBase64Image(svgBase64, width, 'jpeg'),
                    );
                    break;
                case DownloadType.PNG:
                    downloadImage(
                        await base64SvgToBase64Image(
                            svgBase64,
                            width,
                            'png',
                            isBackgroundTransparent,
                        ),
                    );
                    break;
                case DownloadType.JSON:
                    downloadJson(chartInstance.getOption());
                    break;
                default: {
                    assertUnreachable(
                        type,
                        `Unexpected download type: ${type}`,
                    );
                }
            }
        } catch (e) {
            console.error(`Unable to download ${type} from chart ${e}`);
        }
    }, [getChartInstance, type, isBackgroundTransparent]);

    return (
        <Stack>
            <Text fw={500}>Options</Text>
            <Select
                size="xs"
                id="download-type"
                value={type}
                onChange={(value) => setType(value as DownloadType)}
                data={Object.values(DownloadType)
                    .filter(
                        (downloadType) =>
                            !unavailableOptions?.includes(downloadType),
                    )
                    .map((downloadType) => ({
                        value: downloadType,
                        label: downloadType,
                    }))}
            />
            {type === DownloadType.PNG && (
                <SegmentedControl
                    size="xs"
                    id="background-transparency"
                    value={isBackgroundTransparent ? 'Transparent' : 'Opaque'}
                    onChange={(value) =>
                        setIsBackgroundTransparent(value === 'Transparent')
                    }
                    data={[
                        { value: 'Opaque', label: 'Opaque' },
                        { value: 'Transparent', label: 'Transparent' },
                    ]}
                />
            )}
            <Button
                size="xs"
                ml="auto"
                leftIcon={<MantineIcon icon={IconDownload} />}
                onClick={onDownload}
            >
                Download
            </Button>
        </Stack>
    );
};

export default ChartDownloadOptions;