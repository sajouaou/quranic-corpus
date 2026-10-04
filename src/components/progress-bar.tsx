import { formatCount, formatPercent } from '../progress/format';
import { combineClassNames } from '../theme/class-names';
import './progress-bar.scss';

type Props = {
    label: string,
    count: number,
    total: number,
    unit: string,
    className?: string
}

export const ProgressBar = ({ label, count, total, unit, className }: Props) => {
    const percent = formatPercent(count, total);
    const detail = `${formatCount(count)} of ${formatCount(total)} ${unit}`;

    return (
        <div className={combineClassNames('progress-bar', className)}>
            <div className='heading'>
                <span className='label'>{label}</span>
                <span className='percent'>{percent}</span>
            </div>
            <div
                className='track'
                role='progressbar'
                aria-label={label}
                aria-valuemin={0}
                aria-valuemax={total}
                aria-valuenow={count}
                aria-valuetext={`${percent}, ${detail}`}>
                <div className='fill' style={{ width: `${total ? count / total * 100 : 0}%` }} />
            </div>
            <div className='detail'>{detail}</div>
        </div>
    )
}
