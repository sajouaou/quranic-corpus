export const formatCount = (n: number) => n.toLocaleString('en-US')

// Rounds down to one decimal place, so only complete work is shown as 100%.
export const formatPercent = (count: number, total: number) => {
    if (total === 0) return '0%';
    return `${Math.floor(count / total * 1000) / 10}%`;
}
