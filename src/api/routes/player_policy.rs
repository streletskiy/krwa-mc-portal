use crate::errors::{AsterError, Result};
use crate::types::UserRole;

/// Advanced wardrobe and character lifecycle operations belong to administrators.
pub fn require_admin(role: UserRole) -> Result<()> {
    if role == UserRole::Admin {
        Ok(())
    } else {
        Err(AsterError::auth_forbidden(
            "Character names and wardrobe management are controlled by an administrator",
        ))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn player_policy_preserves_admin_access_only() {
        assert!(require_admin(UserRole::Admin).is_ok());
        assert!(require_admin(UserRole::User).is_err());
        assert!(require_admin(UserRole::Operator).is_err());
    }
}
