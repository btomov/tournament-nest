import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(() => {
    service = new UsersService();
  });

  it('returns a hardcoded user by id', () => {
    const user = service.findById('user1');

    expect(user).toEqual({
      id: 'user1',
      username: 'alice',
      displayName: 'Alice',
    });
  });

  it('returns null when id does not exist', () => {
    expect(service.findById('missing-user')).toBeNull();
  });
});

