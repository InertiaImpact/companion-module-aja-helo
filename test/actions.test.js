const assert = require('node:assert/strict')
const { test } = require('node:test')

const actions = require('../src/actions')

function createRenameFileHarness() {
	let actionDefinitions
	const commands = []

	const instance = {
		config: { model: 'test' },
		STATE: {
			recorder_status_value: 0,
			stream_status_value: 0,
			PresetNames: [],
		},
		connection: {
			async sendRequest(command) {
				commands.push(command)
				return { status: 'success' }
			},
		},
		log() {},
		setActionDefinitions(definitions) {
			actionDefinitions = definitions
		},
		updateStatus() {},
	}

	actions.updateActions.call(instance)

	return {
		commands,
		renameFile: actionDefinitions.renameFile,
	}
}

test('Rename File advertises variable support', () => {
	const { renameFile } = createRenameFileHarness()
	const fileNameOption = renameFile.options.find((option) => option.id === 'fileName')

	assert.equal(fileNameOption.type, 'textinput')
	assert.equal(fileNameOption.useVariables, true)
})

test('Rename File resolves a custom global variable before sending it to the HELO', async () => {
	const { commands, renameFile } = createRenameFileHarness()
	const variable = '$(custom:AircheckCurrentOutput)'

	await renameFile.callback(
		{ options: { fileName: variable } },
		{
			async parseVariablesInString(value) {
				assert.equal(value, variable)
				return 'Aircheck_20260717'
			},
		}
	)

	assert.deepEqual(commands, ['action=set&paramid=eParamID_FilenamePrefix&value=Aircheck_20260717'])
})

test('Rename File continues to accept literal text', async () => {
	const { commands, renameFile } = createRenameFileHarness()

	await renameFile.callback(
		{ options: { fileName: 'Evening_News' } },
		{
			async parseVariablesInString(value) {
				return value
			},
		}
	)

	assert.deepEqual(commands, ['action=set&paramid=eParamID_FilenamePrefix&value=Evening_News'])
})
