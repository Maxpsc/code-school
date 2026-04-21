import { useState, useContext } from 'react'
import { DispatchContext } from './context'

export const AddInput = () => {
	const dispatch = useContext(DispatchContext)
	const [text, setText] = useState('')

	if (!dispatch) return null

	return (
		<div>
			<input
				placeholder="Add task"
				value={text}
				onChange={e => setText(e.target.value)}
			/>
			<button onClick={() => {
				if (!text.trim()) return
				dispatch({
					type: 'add',
					content: text,
				})
				setText('')
			}}>Add</button>
		</div>
	)
}
