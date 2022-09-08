import { Colors, FormGroup } from '@blueprintjs/core';
import styled from 'styled-components';

export const ConfigWrapper = styled(FormGroup)`
    max-width: 28.571em;
    width: 25em;
    padding: 1.429em;
    margin: 0;
    & label.bp4-label {
        display: inline-flex;
        gap: 0.214em;
        color: ${Colors.DARK_GRAY1};
        font-weight: 600;
    }
`;

export const SectionTitle = styled.p`
    color: ${Colors.DARK_GRAY1};
    font-weight: 600;
    margin-bottom: 0.286em;
`;

export const StyledFormGroup = styled(FormGroup)`
    margin: 1.357em 0 0;
    & label.bp4-label {
        display: inline-flex;
        gap: 0.214em;
        color: ${Colors.DARK_GRAY1};
        font-weight: 600;
    }
`;

export const ConfigPanelWrapper = styled.div`
    padding: 20px;
    min-width: 350px;

    > .bp4-form-group:last-child {
        margin-bottom: 5px;
    }
`;
