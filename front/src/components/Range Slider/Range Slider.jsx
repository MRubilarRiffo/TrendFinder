import Box from '@mui/material/Box';
import Slider from '@mui/material/Slider';

const RangeSlider = ({ min = 0, max = 100, defaultValue = 70, handleChange }) => {
    return (
        <Box sx={{ width: '100%', padding: 0 }}>
            <Slider
                size="small"
                defaultValue={defaultValue}
                aria-label="Small"
                valueLabelDisplay="auto"
                min={min}
                max={max}
                onChangeCommitted={handleChange}
                sx={{
                    padding: 0,
                    color: '#0AB39C',
                    '& .MuiSlider-thumb.Mui-focusVisible': {
                        boxShadow: 'none'
                    },
                    '& .MuiSlider-thumb:hover': {
                        boxShadow: '0px 0px 0px 8px #0AB39C32'
                    },
                }}
            />
        </Box>
    );
};

export { RangeSlider };