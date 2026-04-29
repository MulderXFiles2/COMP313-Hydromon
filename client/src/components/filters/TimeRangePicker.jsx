/**
 * TimeRangePicker.jsx
 *
 * UI control for selecting a time window (e.g. last hour, day, week).
 * Used to filter historical sensor data displayed in charts and tables.
 */

const DEFAULT_OPTIONS = [
	{ value: "0.25", label: "Last 15 Minutes" },
	{ value: "1", label: "Last Hour" },
	{ value: "6", label: "Last 6 Hours" },
	{ value: "24", label: "Last 24 Hours" },
];

function TimeRangePicker({
	value = "24",
	onChange,
	options = DEFAULT_OPTIONS,
	label = "Time Range",
	id = "time-range-picker",
}) {
	return (
		<label className="filter-control" htmlFor={id}>
			<span className="filter-label">{label}</span>
			<select
				id={id}
				className="filter-select"
				value={value}
				onChange={(event) => onChange?.(event.target.value)}
			>
				{options.map((option) => (
					<option key={option.value} value={option.value}>
						{option.label}
					</option>
				))}
			</select>
		</label>
	);
}

export default TimeRangePicker;
