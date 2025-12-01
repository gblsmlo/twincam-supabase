'use server'

import { type Result, success } from '@shared/errors'
import { sleep } from '@utils/sleep'
import type { RecoveryPasswordFormData } from '../schemas'

export async function recoveryPasswordAction(
	formData: RecoveryPasswordFormData,
): Promise<Result<void>> {
	await sleep(2000)

	console.log(formData)

	return success(undefined)
}
