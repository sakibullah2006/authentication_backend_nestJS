import { createParamDecorator, ExecutionContext } from "@nestjs/common";

const getCurentUserByContext = (context: ExecutionContext) => context.switchToHttp().getRequest().user

export const CurrentUser = createParamDecorator(
    (_data: unknown, context: ExecutionContext) =>
        getCurentUserByContext(context)
)