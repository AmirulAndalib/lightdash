import {
    SchedulerJobStatus,
    type ApiError,
    type ApiJobScheduledResponse,
    type ApiJobStatusResponse,
    type ResultRow,
    type SqlRunnerBody,
} from '@lightdash/common';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { lightdashApi } from '../../../api';
import useToaster from '../../../hooks/toaster/useToaster';
import { getSchedulerJobStatus } from '../../scheduler/hooks/useScheduler';
import { useAppSelector } from '../store/hooks';

const scheduleSqlJob = async ({
    projectUuid,
    sql,
}: {
    projectUuid: string;
    sql: SqlRunnerBody['sql'];
}) =>
    lightdashApi<ApiJobScheduledResponse['results']>({
        url: `/projects/${projectUuid}/sqlRunner/run`,
        method: 'POST',
        body: JSON.stringify({ sql }),
    });

export const useSqlQueryRun = () => {
    const { showToastError, showToastSuccess } = useToaster();
    const projectUuid = useAppSelector((state) => state.sqlRunner.projectUuid);
    const queryClient = useQueryClient();
    const sqlQueryRunMutation = useMutation<
        ApiJobScheduledResponse['results'],
        ApiError,
        {
            projectUuid: string;
            sql: SqlRunnerBody['sql'];
        }
    >(({ sql }) => scheduleSqlJob({ projectUuid, sql }), {
        mutationKey: ['sqlRunner', 'run'],
    });

    const { data: sqlQueryJob } = sqlQueryRunMutation;

    const { data: scheduledDeliveryJobStatus } = useQuery<
        ApiJobStatusResponse['results'] | undefined,
        ApiError
    >(
        ['jobStatus', sqlQueryJob?.jobId],
        () => {
            if (!sqlQueryJob?.jobId) return;
            return getSchedulerJobStatus(sqlQueryJob.jobId);
        },
        {
            refetchInterval: (data) => {
                if (
                    data?.status === SchedulerJobStatus.COMPLETED ||
                    data?.status === SchedulerJobStatus.ERROR
                )
                    return false;
                return 2000;
            },
            onSuccess: (data) => {
                if (data?.status === SchedulerJobStatus.COMPLETED) {
                    showToastSuccess({
                        title: 'SQL query ran successfully',
                    });
                }
                if (data?.status === SchedulerJobStatus.ERROR) {
                    showToastError({
                        title: 'Could not run SQL query',
                        subtitle: data.details?.error,
                    });
                }
            },
            onError: async () => {
                await queryClient.cancelQueries([
                    'jobStatus',
                    sqlQueryJob?.jobId,
                ]);
            },
            enabled: Boolean(sqlQueryJob && sqlQueryJob?.jobId !== undefined),
        },
    );

    const { data: sqlQueryResults, isLoading: isResultsLoading } = useQuery<
        ResultRow[] | undefined,
        ApiError
    >(
        ['sqlQueryResults', sqlQueryJob?.jobId],
        async () => {
            const url = scheduledDeliveryJobStatus?.details?.fileUrl;
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                },
            });
            const rb = response.body;
            const reader = rb?.getReader();

            const stream = new ReadableStream({
                async start(controller) {
                    async function push() {
                        while (true) {
                            const nextChunk = await reader?.read();
                            if (nextChunk?.done) {
                                controller.close();
                                break;
                            }
                            controller.enqueue(nextChunk?.value);
                        }
                    }

                    await push();
                },
            });

            const responseStream = new Response(stream, {
                headers: { 'Content-Type': 'application/json' },
            });
            const result = await responseStream.text();

            // Split the JSON strings by newline
            const jsonStrings = result.trim().split('\n');
            const jsonObjects = jsonStrings
                .map((jsonString) => {
                    try {
                        return JSON.parse(jsonString);
                    } catch (e) {
                        throw new Error('Error parsing JSON');
                    }
                })
                .filter((obj) => obj !== null);

            return jsonObjects;
        },
        {
            onError: () => {
                showToastError({
                    title: 'Could not fetch SQL query results',
                });
            },
            enabled: Boolean(
                scheduledDeliveryJobStatus?.status ===
                    SchedulerJobStatus.COMPLETED &&
                    scheduledDeliveryJobStatus?.details?.fileUrl !== undefined,
            ),
        },
    );

    const isLoading = useMemo(
        () =>
            scheduledDeliveryJobStatus?.status === SchedulerJobStatus.STARTED &&
            isResultsLoading,
        [scheduledDeliveryJobStatus?.status, isResultsLoading],
    );

    return {
        ...sqlQueryRunMutation,
        isLoading,
        data: sqlQueryResults,
    };
};
