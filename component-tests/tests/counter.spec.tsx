import { test, expect } from '@playwright/experimental-ct-react';
import { Counter } from '../src/Counter';
test('mount a real React component, pass props and verify callback', async ({ mount }) => {
  const changes: number[] = [];
  const component = await mount(<Counter initial={2} onChange={(value) => changes.push(value)} />);
  await expect(component.getByLabel('Count')).toHaveText('2');
  await component.getByRole('button', { name: 'Increment' }).click();
  await expect(component.getByLabel('Count')).toHaveText('3');
  await expect.poll(() => changes).toEqual([3]);
});
test('update component props and unmount', async ({ mount }) => {
  const component = await mount(<Counter initial={0} />);
  await component.update(<Counter initial={0} buttonLabel="Add one" />);
  await component.getByRole('button', { name: 'Add one' }).click();
  await expect(component.getByLabel('Count')).toHaveText('1');
  await component.unmount();
  await expect(component.getByRole('button')).toHaveCount(0);
});
