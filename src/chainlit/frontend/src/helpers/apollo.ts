import { ApolloError } from '@apollo/client';

export const getErrorMessage = (error?: ApolloError) => {
  const gqlErrors = error?.graphQLErrors;
  if (gqlErrors && gqlErrors.length > 0) {
    const gqlError = gqlErrors[0];
    const origError = gqlError?.extensions.originalError;
    if (origError) {
      return (origError as Error).message;
    }
  }
  return error?.message;
};
