import { Logger } from '@nestjs/common';
import { type UserProfile } from '@app/contracts';
import { UserController } from './user.controller';
import { UsersService } from './users.service';

type MockedUsersService = Pick<jest.Mocked<UsersService>, 'findById'>;

describe('UserController', () => {
  let controller: UserController;
  let usersService: MockedUsersService;
  let loggerSpy: jest.SpyInstance;

  beforeEach(() => {
    usersService = {
      findById: jest.fn(),
    };

    loggerSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();

    controller = new UserController(usersService as unknown as UsersService);
  });

  afterEach(() => {
    loggerSpy.mockRestore();
  });

  it('returns user profile when found', () => {
    const user: UserProfile = {
      id: 'user1',
      username: 'alice',
      displayName: 'Alice',
    };
    usersService.findById.mockReturnValue(user);

    const response = controller.getById({
      correlationId: 'corr-1',
      playerId: 'user1',
    });

    expect(usersService.findById).toHaveBeenCalledWith('user1');
    expect(response).toEqual(user);
  });

  it('returns null when user does not exist', () => {
    usersService.findById.mockReturnValue(null);

    const response = controller.getById({
      correlationId: 'corr-2',
      playerId: 'missing-user',
    });

    expect(usersService.findById).toHaveBeenCalledWith('missing-user');
    expect(response).toBeNull();
  });
});
