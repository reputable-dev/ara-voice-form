import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import Card from '../Card';

describe('Card Component', () => {
  it('renders children correctly', () => {
    const { getByText } = render(
      <Card>
        <Text>Card Content</Text>
      </Card>
    );

    expect(getByText('Card Content')).toBeTruthy();
  });

  it('applies custom styles', () => {
    const customStyle = { padding: 20 };
    const { getByTestId } = render(
      <Card style={customStyle} testID="custom-card">
        <Text>Content</Text>
      </Card>
    );

    const card = getByTestId('custom-card');
    expect(card.props.style).toEqual(expect.arrayContaining([
      expect.objectContaining(customStyle)
    ]));
  });

  it('renders multiple children', () => {
    const { getByText } = render(
      <Card>
        <Text>First Child</Text>
        <Text>Second Child</Text>
      </Card>
    );

    expect(getByText('First Child')).toBeTruthy();
    expect(getByText('Second Child')).toBeTruthy();
  });
});
