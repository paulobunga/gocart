import { createSlice } from '@reduxjs/toolkit'

const addressSlice = createSlice({
    name: 'address',
    initialState: {
        list: [],
    },
    reducers: {
        addAddress: (state, action) => {
            state.list.push(action.payload)
        },
        setAddresses: (state, action) => {
            state.list = action.payload
        },
    }
})

export const { addAddress, setAddresses } = addressSlice.actions

export default addressSlice.reducer