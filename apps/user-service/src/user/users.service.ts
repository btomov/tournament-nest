import { Injectable } from '@nestjs/common';
import { type UserProfile } from '@app/contracts';

@Injectable()
export class UsersService {
  private readonly users: UserProfile[] = [
    { id: 'user1', username: 'alice', displayName: 'Alice' },
    { id: 'user2', username: 'bob', displayName: 'Bob' },
    { id: 'user3', username: 'carol', displayName: 'Carol' },
    { id: 'user4', username: 'dan', displayName: 'Dan' },
  ];

  findById(playerId: string): UserProfile | null {
    return this.users.find((user) => user.id === playerId) ?? null;
  }
}
