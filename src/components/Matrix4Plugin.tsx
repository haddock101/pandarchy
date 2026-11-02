import { useEffect, useState } from 'react';
import type { ComponentProps, ComponentType, JSX } from 'react';
import * as levaPlugin from 'leva/plugin';
import { Components, createPlugin, useInputContext } from 'leva/plugin';
import type { LevaInputProps } from 'leva/plugin';
import generateSeededKey from './playfulRandomId.ts';

const { Row, Label } = Components;

/** 16 numbers in THREE.Matrix4's own order (column-major), so `matrix.fromArray(value)` reads them as-is. */
type Matrix4Value = number[];
type Matrix4Settings = { step: number };
type Matrix4Input = { value: Matrix4Value; step?: number };

const IDENTITY: Matrix4Value = [
  1, 0, 0, 0, // Column 1: X-Axis Direction / Scale / Shear
  0, 1, 0, 0, // Column 2: Y-Axis Direction / Scale / Shear
  0, 0, 1, 0, // Column 3: Z-Axis Direction / Scale / Shear
  0, 0, 0, 1 // Column 4: Translation / Perspective
];

// Leva's styled() comes from Stitches, whose types take the type checker ~30 s to work out, even just
// naming them. Reaching it through the module object with a plain type skips that; the styling
// (theme tokens like '$xs' and utils like '$reset') works as before.
type StyledFn = <Tag extends keyof JSX.IntrinsicElements>(
  tag: Tag,
  css: Record<string, unknown>,
) => ComponentType<ComponentProps<Tag>>;
const { styled } = levaPlugin as unknown as { styled: StyledFn };

const Grid = styled('div', {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: '$xs',
});


// Styled like Leva's own number fields, with its theme colours
const Cell = styled('input', {
  $reset: '',
  minWidth: 0,
  height: '$rowHeight',
  padding: '0 $xs',
  borderRadius: '$sm',
  backgroundColor: '$elevation3',
  color: '$highlight3',
  fontFamily: '$mono',
  fontSize: '$root',
  textAlign: 'right',
  $inputStyle: '$elevation1',
  $hover: '',
  '&:focus': { color: '$highlight3' },
});
const CellKey = generateSeededKey;
const format = (n: number) => String(Number(n.toFixed(3)));

/** One number of the matrix. Typing is kept as text until it reads as a number, so "-" or "0." survive. */
function MatrixCell({ value, step, onCommit }: { value: number; step: number; onCommit: (n: number) => void }) {
  const [text, setText] = useState(format(value));
  // Follow changes made elsewhere (another cell, code, a reset)
  useEffect(() => setText(format(value)), [value]);
  
  return (
    <Cell
      type="number"
      step={step}
      value={text}
      onChange={(e) => {
        setText(e.target.value);
        const n = parseFloat(e.target.value);
        if (Number.isFinite(n)) onCommit(n);
      }}
      onBlur={() => setText(format(value))}
    />
  );
}

function Matrix4Component() {
  const { label, value, onUpdate, settings } = useInputContext<LevaInputProps<Matrix4Value, Matrix4Settings>>();
  const set = (index: number, n: number) => onUpdate(value.map((v, i) => (i === index ? n : v)));
  return (
    <Row input>
      <Label>{label}</Label>
      <Grid>
        {/* Laid out as the matrix is written (row by row), though the value is stored column by column */}
        {Array.from({ length: 16 }, (_, cell) => {
          const row = Math.floor(cell / 4);
          const col = cell % 4;
          const index = col * 4 + row;
          const key = CellKey(index, 'cell');
          return <MatrixCell key={`${key}-${index}`} value={value[index]} step={settings.step} onCommit={(n) => set(index, n)} />;
        })}
      </Grid>
    </Row>
  );
}

/**
 * A 4×4 matrix in the Leva panel. Use it like any other input:
 *
 *   const { transform } = useControls({ transform: matrix4({ value: new THREE.Matrix4().elements, step: 0.05 }) })
 *   const m = new THREE.Matrix4().fromArray(transform)
 */
export const matrix4 = createPlugin<Matrix4Input, Matrix4Value, Matrix4Settings>({
  component: Matrix4Component,
  normalize: ({ value = IDENTITY, step = 0.001 }) => ({ value: [...value], settings: { step } }),
  sanitize: (value) => {
    if (!Array.isArray(value) || value.length !== 16 || !value.every((n) => Number.isFinite(n))) {
      throw new Error('A Matrix4 needs 16 finite numbers');
    }
    return value;
  },
});

export default matrix4;
